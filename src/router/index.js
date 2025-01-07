import { createRouter, createWebHashHistory } from 'vue-router'
import GameLobby from '../views/GameLobby.vue'
import SnakeGame from '../components/SnakeGame.vue'

const routes = [
  {
    path: '/',
    name: 'GameLobby',
    component: GameLobby
  },
  {
    path: '/snake',
    name: 'SnakeGame',
    component: SnakeGame
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 