<template>
  <div class="snake-game-container">
    <div class="game-header">
      <router-link to="/" class="back-button">
        <span class="back-icon">←</span>
        返回
      </router-link>
      <h1 class="game-title">贪吃蛇</h1>
    </div>
    <div 
      class="snake-game" 
      tabindex="0" 
      @keydown="handleKeyPress" 
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      ref="gameContainer"
      @blur="handleBlur"
      :class="{ 'game-focus': isPlaying }"
    >
      <div class="game-board" :style="{ width: boardSize + 'px', height: boardSize + 'px' }">
        <!-- 方向提示 -->
        <div 
          v-if="gestureDirection" 
          class="gesture-hint"
          :class="gestureDirection"
        >
          <div class="arrow"></div>
          <div class="direction-text">{{ directionText }}</div>
        </div>
        <!-- 蛇身 -->
        <div
          v-for="(segment, index) in snake"
          :key="index"
          class="snake-segment"
          :style="{ left: segment.x * gridSize + 'px', top: segment.y * gridSize + 'px' }"
        ></div>
        <!-- 食物 -->
        <div
          class="food"
          :style="{ left: food.x * gridSize + 'px', top: food.y * gridSize + 'px' }"
        ></div>
        <!-- 陷阱 -->
        <div
          v-for="(trap, index) in traps"
          :key="'trap-' + index"
          class="trap"
          :style="{ left: trap.x * gridSize + 'px', top: trap.y * gridSize + 'px' }"
        ></div>
        <!-- 得分特效 -->
        <transition-group name="score-effect" tag="div">
          <div
            v-for="effect in scoreEffects"
            :key="effect.id"
            class="score-popup"
            :data-points="effect.points"
            :style="{
              left: effect.x * gridSize + 'px',
              top: effect.y * gridSize + 'px'
            }"
          >
            {{ effect.points > 0 ? '+' + effect.points : effect.points }}
          </div>
        </transition-group>
      </div>
      <div class="game-info">
        <div class="score">得分: {{ score }}</div>
        <div class="boost-energy-bar">
          <div class="boost-energy-fill" :style="{ width: boostEnergy + '%' }"></div>
          <span class="boost-energy-text">加速能量: {{ boostEnergy }}%</span>
        </div>
        <div class="difficulty-select" v-if="!isPlaying">
          <div class="difficulty-title">选择难度:</div>
          <div class="difficulty-buttons">
            <button 
              @click="selectDifficulty('easy')" 
              :class="{ active: selectedDifficulty === 'easy' }"
              class="difficulty-btn easy"
            >简单</button>
            <button 
              @click="selectDifficulty('hard')" 
              :class="{ active: selectedDifficulty === 'hard' }"
              class="difficulty-btn hard"
            >困难</button>
            <button 
              @click="selectDifficulty('hell')" 
              :class="{ active: selectedDifficulty === 'hell' }"
              class="difficulty-btn hell"
            >地狱</button>
          </div>
        </div>
        <button @click="handleStartGame" v-if="!isPlaying" class="start-btn">开始游戏</button>
        <div class="game-over" v-if="gameOver">
          游戏结束！
          <div class="final-score">最终得分: {{ score }}</div>
          <button @click="handleStartGame">重新开始</button>
        </div>
        <div class="controls-info" v-if="!isPlaying">
          <p>方向键控制移动</p>
          <p>空格键加速</p>
          <p>或使用鼠标滑动控制方向</p>
        </div>
        <div class="cheat-controls" v-if="showCheatToggle">
          <div class="cheat-toggle">
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="cheatMode"
                @change="handleCheatModeChange"
              >
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">自动模式</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SnakeGame',
  data() {
    return {
      boardSize: 400,
      gridSize: 20,
      snake: [],
      food: { x: 0, y: 0 },
      traps: [],
      direction: 'right',
      isPlaying: false,
      gameOver: false,
      score: 0,
      gameInterval: null,
      scoreEffects: [],
      effectId: 0,
      trapCount: 3,
      difficultyLevel: 1,
      normalSpeed: 150,
      boostSpeed: 50,
      isBoost: false,
      boostEnergy: 100,
      boostEnergyInterval: null,
      focusInterval: null,
      selectedDifficulty: 'easy',
      difficultySettings: {
        easy: {
          speed: 150,
          initialTraps: 2,
          maxTraps: 5,
          speedIncrease: 5,
          scoreMultiplier: 1,
          boostSpeed: 50
        },
        hard: {
          speed: 120,
          initialTraps: 4,
          maxTraps: 8,
          speedIncrease: 8,
          scoreMultiplier: 2,
          boostSpeed: 40
        },
        hell: {
          speed: 100,
          initialTraps: 6,
          maxTraps: 12,
          speedIncrease: 12,
          scoreMultiplier: 3,
          boostSpeed: 30
        }
      },
      mouseGesture: {
        isMouseDown: false,
        startX: 0,
        startY: 0,
        minSwipeDistance: 30,
        currentDirection: null
      },
      cheatMode: false,
      autoPlayInterval: null,
      showCheatToggle: false,
    }
  },
  computed: {
    gestureDirection() {
      return this.mouseGesture.currentDirection;
    },
    directionText() {
      const texts = {
        up: '↑ 上',
        down: '↓ 下',
        left: '← 左',
        right: '→ 右'
      };
      return texts[this.mouseGesture.currentDirection] || '';
    }
  },
  mounted() {
    this.$refs.gameContainer.focus();
    window.addEventListener('keydown', this.handleBoostStart);
    window.addEventListener('keyup', this.handleBoostEnd);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleBoostStart);
    window.removeEventListener('keyup', this.handleBoostEnd);
  },
  methods: {
    handleStartGame(event) {
      event.stopPropagation();
      this.startGame();
      this.$nextTick(() => {
        this.$refs.gameContainer.focus();
      });
    },
    
    handleBlur() {
      if (this.isPlaying) {
        this.$nextTick(() => {
          this.$refs.gameContainer.focus();
        });
      }
    },
    
    startGame() {
      const settings = this.difficultySettings[this.selectedDifficulty];
      this.snake = [
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 }
      ];
      this.direction = 'right';
      this.score = 0;
      this.gameOver = false;
      this.isPlaying = true;
      this.difficultyLevel = 1;
      this.normalSpeed = settings.speed;
      this.boostSpeed = settings.boostSpeed;
      this.trapCount = settings.initialTraps;
      this.maxTraps = settings.maxTraps;
      this.speedIncrease = settings.speedIncrease;
      this.scoreMultiplier = settings.scoreMultiplier;
      
      this.generateFood();
      this.generateTraps();
      this.boostEnergy = 100;
      this.isBoost = false;
      
      if (this.gameInterval) {
        clearInterval(this.gameInterval);
      }
      
      this.gameInterval = setInterval(this.gameLoop, this.normalSpeed);
      this.startEnergyRecovery();
      
      if (this.focusInterval) {
        clearInterval(this.focusInterval);
      }
      
      this.focusInterval = setInterval(() => {
        if (this.isPlaying && document.activeElement !== this.$refs.gameContainer) {
          this.$refs.gameContainer.focus();
        }
      }, 500);
      
      window.addEventListener('keydown', this.toggleCheatMode);
      
      if (this.cheatMode) {
        this.startAutoPlay();
      }
    },
    
    generateFood() {
      const gridCount = this.boardSize / this.gridSize;
      let newFood;
      do {
        newFood = {
          x: Math.floor(Math.random() * gridCount),
          y: Math.floor(Math.random() * gridCount)
        };
      } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
      this.food = newFood;
    },
    
    generateTraps() {
      const gridCount = this.boardSize / this.gridSize;
      this.traps = [];
      
      for (let i = 0; i < this.trapCount; i++) {
        let newTrap;
        do {
          newTrap = {
            x: Math.floor(Math.random() * gridCount),
            y: Math.floor(Math.random() * gridCount)
          };
        } while (
          this.snake.some(segment => segment.x === newTrap.x && segment.y === newTrap.y) ||
          this.traps.some(trap => trap.x === newTrap.x && trap.y === newTrap.y) ||
          (this.food.x === newTrap.x && this.food.y === newTrap.y)
        );
        this.traps.push(newTrap);
      }
    },
    
    checkTrapCollision(head) {
      return this.traps.some(trap => trap.x === head.x && trap.y === head.y);
    },
    
    handleKeyPress(event) {
      const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      
      const newDirection = keyMap[event.key];
      if (!newDirection) return;
      
      this.handleDirectionChange(newDirection);
    },
    
    gameLoop() {
      const head = { ...this.snake[0] };
      const gridCount = this.boardSize / this.gridSize;
      
      switch (this.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }
      
      // 检查是否撞墙
      if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) {
        this.endGame();
        return;
      }
      
      // 移除自身碰撞检测
      // if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      //   this.endGame();
      //   return;
      // }
      
      // 当吃到自己时，将被吃掉的部分移除
      const collisionIndex = this.snake.findIndex(segment => 
        segment.x === head.x && segment.y === head.y
      );
      
      if (collisionIndex > 0) {
        // 从碰撞点开始移除后面的所有部分
        this.snake = this.snake.slice(0, collisionIndex);
        // 显示得分效果
        this.showScoreEffect(head.x, head.y, -5);
        this.score = Math.max(0, this.score - 5);
      }
      
      this.snake.unshift(head);
      
      if (head.x === this.food.x && head.y === this.food.y) {
        const points = 10 * this.scoreMultiplier;
        this.score += points;
        this.showScoreEffect(head.x, head.y, points);
        this.generateFood();
        
        if (this.score % 50 === 0) {
          this.increaseDifficulty();
        }
      } else {
        this.snake.pop();
      }
    },
    
    increaseDifficulty() {
      const settings = this.difficultySettings[this.selectedDifficulty];
      this.difficultyLevel++;
      this.trapCount = Math.min(settings.maxTraps, this.trapCount + 1);
      this.generateTraps();
      this.normalSpeed = Math.max(50, settings.speed - this.difficultyLevel * settings.speedIncrease);
      this.updateGameSpeed();
    },
    
    endGame() {
      this.isPlaying = false;
      this.gameOver = true;
      clearInterval(this.gameInterval);
      clearInterval(this.focusInterval);
      this.stopEnergyConsumption();
      if (this.boostEnergyInterval) {
        clearInterval(this.boostEnergyInterval);
      }
      window.removeEventListener('keydown', this.toggleCheatMode);
      this.stopAutoPlay();
    },
    
    showScoreEffect(x, y, points) {
      const effect = {
        id: this.effectId++,
        x,
        y,
        points: typeof points === 'string' ? points : points
      };
      this.scoreEffects.push(effect);
      
      setTimeout(() => {
        const index = this.scoreEffects.findIndex(e => e.id === effect.id);
        if (index !== -1) {
          this.scoreEffects.splice(index, 1);
        }
      }, 1000);
    },
    
    handleBoostStart(event) {
      if (event.code === 'Space' && !this.isBoost && this.isPlaying) {
        event.preventDefault();
        // 如果是自动模式，不消耗能量
        if (this.cheatMode || this.boostEnergy > 0) {
          this.isBoost = true;
          this.updateGameSpeed();
          if (!this.cheatMode) {
            this.startEnergyConsumption();
          }
        }
      }
    },
    
    handleBoostEnd(event) {
      if (event.code === 'Space' && this.isBoost) {
        this.isBoost = false;
        this.updateGameSpeed();
        this.stopEnergyConsumption();
      }
    },
    
    updateGameSpeed() {
      clearInterval(this.gameInterval);
      const currentSpeed = this.isBoost ? this.boostSpeed : this.normalSpeed;
      this.gameInterval = setInterval(this.gameLoop, currentSpeed);
    },
    
    startEnergyConsumption() {
      // 自动模式下不消耗能量
      if (this.cheatMode) {
        return;
      }
      
      this.boostEnergyInterval = setInterval(() => {
        this.boostEnergy = Math.max(0, this.boostEnergy - 5);
        if (this.boostEnergy === 0) {
          this.handleBoostEnd({ code: 'Space' });
        }
      }, 100);
    },
    
    stopEnergyConsumption() {
      if (this.boostEnergyInterval) {
        clearInterval(this.boostEnergyInterval);
        this.boostEnergyInterval = null;
      }
    },
    
    startEnergyRecovery() {
      this.boostEnergyInterval = setInterval(() => {
        // 自动模式下保持能量满格
        if (this.cheatMode) {
          this.boostEnergy = 100;
        } else if (!this.isBoost && this.boostEnergy < 100) {
          this.boostEnergy = Math.min(100, this.boostEnergy + 1);
        }
      }, 200);
    },
    
    selectDifficulty(difficulty) {
      this.selectedDifficulty = difficulty;
    },
    
    // 鼠标手势控制
    handleMouseDown(event) {
      if (!this.isPlaying) return;
      this.mouseGesture.isMouseDown = true;
      this.mouseGesture.startX = event.clientX;
      this.mouseGesture.startY = event.clientY;
    },

    handleMouseMove(event) {
      if (!this.mouseGesture.isMouseDown || !this.isPlaying) return;
      
      const deltaX = event.clientX - this.mouseGesture.startX;
      const deltaY = event.clientY - this.mouseGesture.startY;
      
      if (Math.abs(deltaX) < this.mouseGesture.minSwipeDistance && 
          Math.abs(deltaY) < this.mouseGesture.minSwipeDistance) {
        this.mouseGesture.currentDirection = null;
        return;
      }
      
      // 判断主要移动方向
      let newDirection;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平移动
        newDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        // 垂直移动
        newDirection = deltaY > 0 ? 'down' : 'up';
      }
      
      this.mouseGesture.currentDirection = newDirection;
      this.handleDirectionChange(newDirection);
      
      // 重置起始点，实现连续滑动
      this.mouseGesture.startX = event.clientX;
      this.mouseGesture.startY = event.clientY;
    },

    handleMouseUp() {
      this.mouseGesture.isMouseDown = false;
      this.mouseGesture.currentDirection = null;
    },

    // 触摸事件处理
    handleTouchStart(event) {
      if (!this.isPlaying) return;
      const touch = event.touches[0];
      this.mouseGesture.isMouseDown = true;
      this.mouseGesture.startX = touch.clientX;
      this.mouseGesture.startY = touch.clientY;
    },

    handleTouchMove(event) {
      event.preventDefault();
      if (!this.mouseGesture.isMouseDown || !this.isPlaying) return;
      
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.mouseGesture.startX;
      const deltaY = touch.clientY - this.mouseGesture.startY;
      
      if (Math.abs(deltaX) < this.mouseGesture.minSwipeDistance && 
          Math.abs(deltaY) < this.mouseGesture.minSwipeDistance) {
        this.mouseGesture.currentDirection = null;
        return;
      }
      
      let newDirection;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        newDirection = deltaY > 0 ? 'down' : 'up';
      }
      
      this.mouseGesture.currentDirection = newDirection;
      this.handleDirectionChange(newDirection);
      
      this.mouseGesture.startX = touch.clientX;
      this.mouseGesture.startY = touch.clientY;
    },

    handleTouchEnd() {
      this.mouseGesture.isMouseDown = false;
      this.mouseGesture.currentDirection = null;
    },

    // 统一处理方向改变
    handleDirectionChange(newDirection) {
      const opposites = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
      };
      
      if (opposites[newDirection] !== this.direction) {
        this.direction = newDirection;
      }
    },

    // 添加外挂模式切换方法
    toggleCheatMode(event) {
      // 使用 Ctrl + Alt + T 显示/隐藏开关
      if (event.ctrlKey && event.altKey && event.code === 'KeyT') {
        this.showCheatToggle = !this.showCheatToggle;
      }
    },

    // 自动寻路到食物
    findPathToFood() {
      const head = this.snake[0];
      const diffX = this.food.x - head.x;
      const diffY = this.food.y - head.y;
      
      // 创建一个方向优先级队列
      const directions = [];
      
      // 根据食物位置确定方向优先级
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // 水平距离更远，优先水平移动
        if (diffX > 0) {
          directions.push('right', 'up', 'down', 'left');
        } else {
          directions.push('left', 'up', 'down', 'right');
        }
      } else {
        // 垂直距离更远或相等，优先垂直移动
        if (diffY > 0) {
          directions.push('down', 'right', 'left', 'up');
        } else {
          directions.push('up', 'right', 'left', 'down');
        }
      }
      
      // 检查每个方向是否安全
      for (const dir of directions) {
        if (this.isSafeMove(dir)) {
          return dir;
        }
      }
      
      // 如果没有安全的方向，尝试任何可能的移动
      for (const dir of directions) {
        if (this.canMove(dir)) {
          return dir;
        }
      }
      
      return this.direction; // 保持当前方向
    },

    // 添加新的方法来检查移动是否安全
    isSafeMove(direction) {
      const head = this.snake[0];
      const gridCount = this.boardSize / this.gridSize;
      let nextX = head.x;
      let nextY = head.y;
      
      switch (direction) {
        case 'up': nextY--; break;
        case 'down': nextY++; break;
        case 'left': nextX--; break;
        case 'right': nextX++; break;
      }
      
      // 检查是否会撞墙
      if (nextX < 0 || nextX >= gridCount || nextY < 0 || nextY >= gridCount) {
        return false;
      }
      
      // 检查是否会撞到自己
      if (this.snake.some(segment => segment.x === nextX && segment.y === nextY)) {
        return false;
      }
      
      // 检查是否会撞到陷阱
      if (this.traps.some(trap => trap.x === nextX && trap.y === nextY)) {
        return false;
      }
      
      // 检查是否会导致被困
      const nextMoves = ['up', 'down', 'left', 'right'].filter(dir => {
        if (dir === this.getOppositeDirection(direction)) return false;
        let x = nextX;
        let y = nextY;
        switch (dir) {
          case 'up': y--; break;
          case 'down': y++; break;
          case 'left': x--; break;
          case 'right': x++; break;
        }
        return x >= 0 && x < gridCount && y >= 0 && y < gridCount &&
               !this.snake.some(segment => segment.x === x && segment.y === y) &&
               !this.traps.some(trap => trap.x === x && trap.y === y);
      });
      
      // 至少要有一个安全的后续移动
      return nextMoves.length > 0;
    },

    // 添加获取相反方向的辅助方法
    getOppositeDirection(direction) {
      const opposites = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
      };
      return opposites[direction];
    },

    // 检查某个方向是否可以移动
    canMove(direction) {
      const head = this.snake[0];
      const gridCount = this.boardSize / this.gridSize;
      let nextX = head.x;
      let nextY = head.y;
      
      switch (direction) {
        case 'up': nextY--; break;
        case 'down': nextY++; break;
        case 'left': nextX--; break;
        case 'right': nextX++; break;
      }
      
      // 检查是否会撞墙
      if (nextX < 0 || nextX >= gridCount || nextY < 0 || nextY >= gridCount) {
        return false;
      }
      
      // 检查是否会撞到自己
      if (this.snake.some(segment => segment.x === nextX && segment.y === nextY)) {
        return false;
      }
      
      // 检查是否会撞到陷阱
      if (this.traps.some(trap => trap.x === nextX && trap.y === nextY)) {
        return false;
      }
      
      // 检查是否是反方向
      const opposites = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
      };
      if (opposites[direction] === this.direction) {
        return false;
      }
      
      return true;
    },

    startAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
      }
      
      // 自动模式开启时，直接启动加速
      if (this.cheatMode) {
        this.isBoost = true;
        this.boostEnergy = 100; // 设置能量为满
        this.updateGameSpeed();
      }
      
      this.autoPlayInterval = setInterval(() => {
        if (this.isPlaying && this.cheatMode) {
          // 保持能量满格
          this.boostEnergy = 100;
          const nextDirection = this.findPathToFood();
          if (nextDirection) {
            this.direction = nextDirection;
          }
        }
      }, 50);
    },

    stopAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    },

    handleCheatModeChange() {
      if (this.cheatMode) {
        this.startAutoPlay();
        this.showScoreEffect(
          Math.floor(this.boardSize / this.gridSize / 2),
          Math.floor(this.boardSize / this.gridSize / 2),
          '自动模式已开启'
        );
      } else {
        this.stopAutoPlay();
        this.showScoreEffect(
          Math.floor(this.boardSize / this.gridSize / 2),
          Math.floor(this.boardSize / this.gridSize / 2),
          '自动模式已关闭'
        );
      }
    },
  }
}
</script>

<style scoped>
.snake-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
}

.game-header {
  width: 100%;
  max-width: 800px;
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
}

.game-title {
  flex: 1;
  text-align: center;
  font-size: 2.5em;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  animation: title-glow 2s ease-in-out infinite alternate;
}

.back-button {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-5px);
}

.back-icon {
  font-size: 20px;
}

@keyframes title-glow {
  from {
    text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  }
  to {
    text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
  }
}

.snake-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  outline: none;
  user-select: none; /* 防止文本选择 */
  touch-action: none; /* 防止触摸设备的默认行为 */
}

.game-board {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.snake-segment {
  position: absolute;
  width: 18px;
  height: 18px;
  background-color: #4CAF50;
  border-radius: 4px;
  border: 1px solid #45a049;
  box-shadow: 
    0 0 5px rgba(76, 175, 80, 0.5),
    0 0 10px rgba(76, 175, 80, 0.3);
  transition: all 0.1s ease;
}

.food {
  position: absolute;
  width: 18px;
  height: 18px;
  background-color: #ff4444;
  border-radius: 50%;
  border: 1px solid #ff0000;
  animation: food-pulse 1s ease-in-out infinite;
}

@keyframes food-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 68, 68, 0);
  }
}

.game-info {
  text-align: center;
}

.score {
  font-size: 24px;
  margin-bottom: 10px;
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.5),
    0 0 20px rgba(255, 255, 255, 0.3);
  animation: score-glow 1s ease-in-out infinite alternate;
}

@keyframes score-glow {
  from {
    text-shadow: 
      0 0 10px rgba(255, 255, 255, 0.5),
      0 0 20px rgba(255, 255, 255, 0.3);
  }
  to {
    text-shadow: 
      0 0 15px rgba(255, 255, 255, 0.7),
      0 0 25px rgba(255, 255, 255, 0.5);
  }
}

button {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 
    0 0 10px rgba(76, 175, 80, 0.3),
    0 0 20px rgba(76, 175, 80, 0.2);
}

button:hover {
  transform: scale(1.05);
  box-shadow: 
    0 0 15px rgba(76, 175, 80, 0.4),
    0 0 30px rgba(76, 175, 80, 0.3);
}

.game-over {
  font-size: 24px;
  color: #ff4444;
  margin-top: 10px;
  animation: game-over-flash 1s ease-in-out infinite alternate;
}

@keyframes game-over-flash {
  from {
    text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
  }
  to {
    text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
  }
}

.score-popup {
  position: absolute;
  font-size: 24px;
  font-weight: bold;
  pointer-events: none;
  z-index: 100;
  animation: score-animation 1s cubic-bezier(0.23, 1, 0.320, 1) forwards;
}

.score-popup[data-points="10"] {
  color: #ffeb3b;
  text-shadow: 
    0 0 10px rgba(255, 235, 59, 0.8),
    0 0 20px rgba(255, 235, 59, 0.5);
}

.score-popup[data-points="-20"] {
  color: #ff4444;
  text-shadow: 
    0 0 10px rgba(255, 68, 68, 0.8),
    0 0 20px rgba(255, 68, 68, 0.5);
}

.trap {
  position: absolute;
  width: 18px;
  height: 18px;
  background: linear-gradient(45deg, #ff0000, #ff6b6b);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: trap-pulse 2s ease-in-out infinite;
}

@keyframes trap-pulse {
  0% {
    transform: scale(1) rotate(0deg);
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
  50% {
    transform: scale(1.1) rotate(180deg);
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
  }
  100% {
    transform: scale(1) rotate(360deg);
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
}

.boost-energy-bar {
  width: 200px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 10px auto;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.boost-energy-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.2s ease;
  border-radius: 8px;
  position: relative;
}

.boost-energy-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  animation: energy-shine 2s linear infinite;
}

@keyframes energy-shine {
  0% {
    transform: translateX(-200%);
  }
  100% {
    transform: translateX(200%);
  }
}

.boost-energy-text {
  position: absolute;
  width: 100%;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.controls-info {
  margin-top: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.controls-info p {
  margin: 5px 0;
}

.snake-segment {
  position: absolute;
  width: 18px;
  height: 18px;
  background-color: #4CAF50;
  border-radius: 4px;
  border: 1px solid #45a049;
  box-shadow: 
    0 0 5px rgba(76, 175, 80, 0.5),
    0 0 10px rgba(76, 175, 80, 0.3);
  transition: all 0.1s ease;
}

.isBoost .snake-segment {
  box-shadow: 
    0 0 10px rgba(76, 175, 80, 0.7),
    0 0 20px rgba(76, 175, 80, 0.5),
    0 0 30px rgba(76, 175, 80, 0.3);
  background: linear-gradient(45deg, #4CAF50, #45a049);
}

.game-focus {
  outline: none;
  position: relative;
}

.game-focus::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 12px;
  background: transparent;
  pointer-events: none;
  transition: box-shadow 0.3s ease;
}

.game-focus:focus::after {
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.5);
}

button {
  position: relative;
  z-index: 10;
}

.game-info {
  position: relative;
  z-index: 10;
}

.difficulty-select {
  margin: 20px 0;
}

.difficulty-title {
  font-size: 18px;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.difficulty-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.difficulty-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.difficulty-btn.active {
  opacity: 1;
  transform: scale(1.1);
}

.difficulty-btn.easy {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.difficulty-btn.hard {
  background: linear-gradient(45deg, #ff9800, #f57c00);
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.3);
}

.difficulty-btn.hell {
  background: linear-gradient(45deg, #f44336, #d32f2f);
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.3);
}

.difficulty-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.start-btn {
  margin-top: 15px;
  font-size: 18px;
  padding: 12px 30px;
}

.final-score {
  font-size: 20px;
  color: #4CAF50;
  margin: 10px 0;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

[data-difficulty="easy"] .snake-segment {
  background: linear-gradient(45deg, #4CAF50, #45a049);
}

[data-difficulty="hard"] .snake-segment {
  background: linear-gradient(45deg, #ff9800, #f57c00);
}

[data-difficulty="hell"] .snake-segment {
  background: linear-gradient(45deg, #f44336, #d32f2f);
}

/* 添加操作说明 */
.controls-info p:last-child::after {
  content: '或使用鼠标滑动控制方向';
  display: block;
  margin-top: 5px;
  font-style: italic;
  opacity: 0.8;
}

/* 方向提示样式 */
.gesture-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
  z-index: 100;
  animation: hint-fade-in 0.2s ease-out;
}

.gesture-hint .arrow {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  position: relative;
}

.gesture-hint .arrow::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-top: 4px solid rgba(255, 255, 255, 0.8);
  border-right: 4px solid rgba(255, 255, 255, 0.8);
}

.gesture-hint .direction-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.gesture-hint.up .arrow::after {
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
}

.gesture-hint.down .arrow::after {
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(135deg);
}

.gesture-hint.left .arrow::after {
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%) rotate(-135deg);
}

.gesture-hint.right .arrow::after {
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%) rotate(45deg);
}

@keyframes hint-fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.gesture-hint.up { animation: hint-slide-up 0.3s ease-out; }
.gesture-hint.down { animation: hint-slide-down 0.3s ease-out; }
.gesture-hint.left { animation: hint-slide-left 0.3s ease-out; }
.gesture-hint.right { animation: hint-slide-right 0.3s ease-out; }

@keyframes hint-slide-up {
  from { transform: translate(-50%, 0%) scale(0.8); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes hint-slide-down {
  from { transform: translate(-50%, -100%) scale(0.8); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes hint-slide-left {
  from { transform: translate(0%, -50%) scale(0.8); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes hint-slide-right {
  from { transform: translate(-100%, -50%) scale(0.8); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.cheat-controls {
  margin: 15px 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  animation: fade-in 0.3s ease;
}

.cheat-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #4CAF50;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-label {
  color: white;
  font-size: 14px;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 