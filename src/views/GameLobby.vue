<template>
  <div class="game-lobby">
    <h1 class="title">游戏中心</h1>
    <div class="game-list">
      <router-link to="/snake" class="game-card">
        <div class="game-icon">
          <div class="snake-icon">🐍</div>
        </div>
        <div class="game-info">
          <h2>贪吃蛇</h2>
          <p>经典游戏 - 三种难度</p>
          <div class="difficulty-tags">
            <span class="tag easy">简单</span>
            <span class="tag hard">困难</span>
            <span class="tag hell">地狱</span>
          </div>
        </div>
      </router-link>
      <!-- 预留其他游戏卡片位置 -->
      <div class="game-card coming-soon">
        <div class="game-icon">
          <div class="coming-soon-icon">🎮</div>
        </div>
        <div class="game-info">
          <h2>更多游戏</h2>
          <p>敬请期待...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameLobby'
}
</script>

<style scoped>
.game-lobby {
  min-height: 100vh;
  background: linear-gradient(45deg, #000428, #004e92);
  padding: 40px 20px;
  color: white;
}

.title {
  text-align: center;
  font-size: 3em;
  margin-bottom: 40px;
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.game-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.game-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.game-icon {
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
}

.snake-icon {
  animation: snake-dance 2s infinite ease-in-out;
}

@keyframes snake-dance {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
  100% { transform: rotate(0deg); }
}

.game-info {
  flex: 1;
}

.game-info h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.game-info p {
  margin: 0;
  opacity: 0.8;
}

.difficulty-tags {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.tag.easy {
  background: linear-gradient(45deg, #4CAF50, #45a049);
}

.tag.hard {
  background: linear-gradient(45deg, #ff9800, #f57c00);
}

.tag.hell {
  background: linear-gradient(45deg, #f44336, #d32f2f);
}

.coming-soon {
  opacity: 0.6;
  cursor: not-allowed;
}

.coming-soon-icon {
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style> 