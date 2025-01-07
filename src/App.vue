<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  overflow: hidden;
  background: linear-gradient(45deg, #000428, #004e92);
}

#app {
  min-height: 100vh;
  color: white;
}
</style>
