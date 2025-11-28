document.addEventListener('DOMContentLoaded', () => {
    // === 1. Thiết lập các biến và hằng số ===
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const scoreValueSpan = document.getElementById('scoreValue');
    const messageDisplay = document.getElementById('messageDisplay');

    const GRID_SIZE = 20; // Kích thước mỗi ô vuông (rắn, mồi)
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    const GAME_ROWS = CANVAS_HEIGHT / GRID_SIZE;
    const GAME_COLS = CANVAS_WIDTH / GRID_SIZE;

    let snake; // Mảng các đối tượng {x, y} biểu thị thân rắn
    let food;  // Đối tượng {x, y} biểu thị vị trí mồi
    let dx = 0; // Hướng di chuyển theo trục X (1: phải, -1: trái, 0: đứng yên)
    let dy = 0; // Hướng di chuyển theo trục Y (1: xuống, -1: lên, 0: đứng yên)
    let score = 0;
    let gameInterval; // ID của setInterval để điều khiển vòng lặp game
    let gameSpeed = 150; // Tốc độ game (mili giây/frame), càng nhỏ càng nhanh
    let isGameOver = false;
    let isGameRunning = false;
    let changingDirection = false; // Biến cờ để tránh đổi hướng quá nhanh trong một frame

    // === 2. Khởi tạo trò chơi ===
    function initializeGame() {
        snake = [
            { x: GRID_SIZE * 2, y: 0 }, // Đầu rắn
            { x: GRID_SIZE, y: 0 },
            { x: 0, y: 0 }             // Đuôi rắn
        ];
        food = {}; // Mồi sẽ được đặt sau
        dx = GRID_SIZE; // Rắn bắt đầu di chuyển sang phải
        dy = 0;
        score = 0;
        gameSpeed = 120;
        isGameOver = false;
        isGameRunning = false;
        changingDirection = false;
        scoreValueSpan.textContent = score;
        messageDisplay.textContent = 'Nhấn Bắt Đầu để chơi!';
        startButton.textContent = 'Bắt Đầu';

        clearInterval(gameInterval); // Đảm bảo không có vòng lặp game cũ
        createFood(); // Tạo mồi ban đầu
        drawGame(); // Vẽ trạng thái ban đầu
    }

    // === 3. Vẽ trò chơi ===
    function drawGame() {
        // Xóa toàn bộ canvas để vẽ lại
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Vẽ mồi
        drawFood();

        // Vẽ rắn
        snake.forEach(drawSnakePart);
    }

    function drawSnakePart(part) {
        ctx.fillStyle = '#A9E87E'; // Màu xanh lá cho thân rắn
        ctx.strokeStyle = '#2E8B57'; // Viền đậm hơn
        ctx.fillRect(part.x, part.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(part.x, part.y, GRID_SIZE, GRID_SIZE);
    }

    function drawFood() {
        ctx.fillStyle = '#FCE883'; // Màu vàng cho mồi
        ctx.strokeStyle = '#DAA520';
        ctx.fillRect(food.x, food.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(food.x, food.y, GRID_SIZE, GRID_SIZE);
    }

    // === 4. Tạo mồi ===
    function createFood() {
        let newFoodX;
        let newFoodY;
        let collisionWithSnake;

        do {
            // Tạo vị trí ngẫu nhiên cho mồi, đảm bảo nằm trong lưới
            newFoodX = Math.floor(Math.random() * GAME_COLS) * GRID_SIZE;
            newFoodY = Math.floor(Math.random() * GAME_ROWS) * GRID_SIZE;

            // Kiểm tra xem mồi có trùng với thân rắn không
            collisionWithSnake = snake.some(part => part.x === newFoodX && part.y === newFoodY);

        } while (collisionWithSnake); // Lặp lại nếu trùng với rắn

        food = { x: newFoodX, y: newFoodY };
    }

    // === 5. Di chuyển rắn ===
    function moveSnake() {
        if (isGameOver) return;

        // Tạo phần đầu rắn mới dựa trên hướng di chuyển
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Thêm đầu rắn mới vào đầu mảng
        snake.unshift(head);

        const didEatFood = head.x === food.x && head.y === food.y;
        if (didEatFood) {
            score += 10;
            scoreValueSpan.textContent = score;
            createFood(); // Tạo mồi mới
            // Tăng tốc độ game một chút mỗi khi ăn mồi
            gameSpeed = Math.max(50, gameSpeed - 5); // Tốc độ tối thiểu 50ms
            clearInterval(gameInterval); // Dừng vòng lặp cũ
            gameInterval = setInterval(gameLoop, gameSpeed); // Bắt đầu vòng lặp mới với tốc độ mới
        } else {
            // Nếu không ăn mồi, loại bỏ phần đuôi để rắn di chuyển
            snake.pop();
        }

        // Sau khi di chuyển, reset cờ đổi hướng
        changingDirection = false;
    }

    // === 6. Kiểm tra va chạm ===
    function checkCollision() {
        // Kiểm tra rắn có tự cắn mình không (bắt đầu từ đốt thứ 4 trở đi)
        for (let i = 4; i < snake.length; i++) {
            if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
                return true; // Rắn tự cắn mình
            }
        }

        // Kiểm tra va chạm với tường
        const hitLeftWall = snake[0].x < 0;
        const hitRightWall = snake[0].x >= CANVAS_WIDTH;
        const hitTopWall = snake[0].y < 0;
        const hitBottomWall = snake[0].y >= CANVAS_HEIGHT;

        return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
    }

    // === 7. Vòng lặp chính của trò chơi ===
    function gameLoop() {
        if (checkCollision()) {
            isGameOver = true;
            isGameRunning = false;
            messageDisplay.textContent = `Game Over! Điểm của bạn: ${score}.`;
            startButton.textContent = 'Chơi Lại';
            clearInterval(gameInterval); // Dừng vòng lặp game
            return;
        }

        moveSnake();
        drawGame();
    }

    // === 8. Xử lý sự kiện bàn phím để đổi hướng ===
    function changeDirection(event) {
        if (changingDirection || !isGameRunning) return; // Tránh đổi hướng quá nhanh hoặc khi game chưa chạy

        const keyPressed = event.keyCode;
        const LEFT_KEY = 37;
        const RIGHT_KEY = 39;
        const UP_KEY = 38;
        const DOWN_KEY = 40;

        const goingUp = dy === -GRID_SIZE;
        const goingDown = dy === GRID_SIZE;
        const goingRight = dx === GRID_SIZE;
        const goingLeft = dx === -GRID_SIZE;

        changingDirection = true; // Đặt cờ để khóa đổi hướng trong frame này

        if (keyPressed === LEFT_KEY && !goingRight) {
            dx = -GRID_SIZE;
            dy = 0;
        } else if (keyPressed === UP_KEY && !goingDown) {
            dx = 0;
            dy = -GRID_SIZE;
        } else if (keyPressed === RIGHT_KEY && !goingLeft) {
            dx = GRID_SIZE;
            dy = 0;
        } else if (keyPressed === DOWN_KEY && !goingUp) {
            dx = 0;
            dy = GRID_SIZE;
        }
    }

    // === 9. Xử lý nút Bắt đầu/Chơi Lại ===
    startButton.addEventListener('click', () => {
        if (!isGameRunning) {
            initializeGame();
            isGameRunning = true;
            messageDisplay.textContent = 'Chúc may mắn!';
            startButton.textContent = 'Dừng'; // Nút có thể dùng để tạm dừng nếu muốn
            gameInterval = setInterval(gameLoop, gameSpeed);
        } else {
            // Có thể thêm logic tạm dừng/tiếp tục tại đây
            // Hiện tại, nhấn Dừng sẽ dừng game và reset
            isGameRunning = false;
            clearInterval(gameInterval);
            messageDisplay.textContent = 'Game đã tạm dừng. Nhấn Bắt Đầu để tiếp tục hoặc Chơi Lại.';
            startButton.textContent = 'Chơi Lại';
            isGameOver = true; // Đặt game over để khi nhấn chơi lại sẽ reset
        }
    });


    // === 10. Đăng ký sự kiện ===
    document.addEventListener('keydown', changeDirection);

    // === 11. Bắt đầu trò chơi lần đầu khi tải trang ===
    initializeGame();
});