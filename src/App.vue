<template>
<div>
  <header
      class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow"
    >
      <ul class="navbar-nav px-3">
        <router-link to="/">
          <a class="navbar-brand col-md-3 col-lg-2 me-0 px-3"
            >一覧ページ</a
          ></router-link
        >
      </ul>

      <ul class="navbar-nav px-3">
        <router-link to="/company-info">
          <a class="nav-link" href="#">
            111111
          </a>
        </router-link>
      </ul>
    </header>
    <nav></nav>
    <router-view />

  <!-- <CompanyInfo msg="Welcome to Your Vue.js App" /> -->
</div>
</template>

<script>

export default {
  name: "App",
};
</script>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
.q-icon {
  color: white;
  font-weight: bold;
}
</style>
