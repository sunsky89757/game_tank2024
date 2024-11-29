class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = 30;
        this.height = 30;
        this.speed = 3;
        this.direction = 0; // in radians
        this.health = 100;
        this.isPlayer = isPlayer;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 500; // milliseconds
    }

    update() {
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += Math.cos(bullet.direction) * bullet.speed;
            bullet.y += Math.sin(bullet.direction) * bullet.speed;
            return (
                bullet.x >= 0 &&
                bullet.x <= canvas.width &&
                bullet.y >= 0 &&
                bullet.y <= canvas.height
            );
        });
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot >= this.shotCooldown) {
            const bullet = {
                x: this.x + this.width / 2 + Math.cos(this.direction) * this.width,
                y: this.y + this.height / 2 + Math.sin(this.direction) * this.height,
                direction: this.direction,
                speed: 7,
                radius: 3
            };
            this.bullets.push(bullet);
            this.lastShot = now;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.direction);

        // Tank body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Tank cannon
        ctx.fillRect(0, -4, this.width / 2, 8);

        ctx.restore();

        // Draw bullets
        ctx.fillStyle = '#fff';
        this.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        this.player = new Tank(100, 300, '#00ff00', true);
        this.enemies = [new Tank(600, 300, '#ff0000')];
        this.score = 0;
        this.gameOver = false;

        this.keys = {};
        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    }

    handleInput() {
        if (this.keys['w']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['s']) {
            this.player.y += this.player.speed;
        }
        if (this.keys['a']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['d']) {
            this.player.x += this.player.speed;
        }
        if (this.keys['arrowleft']) {
            this.player.direction -= 0.1;
        }
        if (this.keys['arrowright']) {
            this.player.direction += 0.1;
        }
        if (this.keys[' ']) {
            this.player.shoot();
        }
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            // Simple AI: follow player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            enemy.direction = Math.atan2(dy, dx);

            // Move towards player
            enemy.x += Math.cos(enemy.direction) * enemy.speed * 0.5;
            enemy.y += Math.sin(enemy.direction) * enemy.speed * 0.5;

            // Shoot occasionally
            if (Math.random() < 0.02) {
                enemy.shoot();
            }

            enemy.update();
        });
    }

    checkCollisions() {
        // Player bullets hitting enemies
        this.player.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkBulletCollision(bullet, enemy)) {
                    enemy.health -= 20;
                    this.player.bullets.splice(bulletIndex, 1);
                    if (enemy.health <= 0) {
                        this.enemies.splice(enemyIndex, 1);
                        this.score += 100;
                        // Spawn new enemy
                        if (this.enemies.length < 3) {
                            const newX = Math.random() * (this.canvas.width - 100);
                            const newY = Math.random() * (this.canvas.height - 100);
                            this.enemies.push(new Tank(newX, newY, '#ff0000'));
                        }
                    }
                }
            });
        });

        // Enemy bullets hitting player
        this.enemies.forEach(enemy => {
            enemy.bullets.forEach((bullet, bulletIndex) => {
                if (this.checkBulletCollision(bullet, this.player)) {
                    this.player.health -= 10;
                    enemy.bullets.splice(bulletIndex, 1);
                    if (this.player.health <= 0) {
                        this.gameOver = true;
                    }
                }
            });
        });
    }

    checkBulletCollision(bullet, tank) {
        return bullet.x >= tank.x &&
            bullet.x <= tank.x + tank.width &&
            bullet.y >= tank.y &&
            bullet.y <= tank.y + tank.height;
    }

    update() {
        if (this.gameOver) return;

        this.handleInput();
        this.player.update();
        this.updateEnemies();
        this.checkCollisions();

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));

        // Update score display
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = this.player.health;
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        if (this.gameOver) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
