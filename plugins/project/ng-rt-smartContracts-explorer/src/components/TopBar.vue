<template>
  <div class="topBar">
    <div class="container">
      <div class="content">
        <menu-icon class="menuIcon" />
        <router-link to="/" class="brand">project</router-link>
        <div class="subbrand">Smart Contracts</div>

        <div class="menu">
          <router-link to="/">Templates</router-link>
          <router-link to="/instances">Instances</router-link>
        </div>
        <div class="userIcon">
          <User />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import User from "@/components/icons/User";

export default {
  name: "TopBar",
  components: {
    User,
  },
  methods: {},
};
</script>

<style scoped lang="scss">
.topBar {
  background-color: white;
  /* border-bottom: 1px solid rgba(0, 0, 0, 0.05); */

  .menuIcon {
    font-size: 1.4rem;
  }

  .userIcon {
    margin: 0 0 0 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;

    background-color: #dedede;
    display: flex;
    justify-content: center;
    align-items: center;
    svg {
      fill: white;
    }
  }
}

.content {
  display: flex;
  flex-direction: row;
  min-height: 50px;
  height: 50px;
  align-items: center;
}

.brand {
  margin: 0 0 0 20px;
  flex: 0;
  text-decoration: none;
  text-transform: uppercase;
  font-weight: 800;
  padding: 0 30px 0 0;
  color: var(--active-color);
  font-size: 1rem;
}

.subbrand {
  border-left: 1px solid rgb(224, 224, 224);
  padding: 0 0 0 20px;
  flex: 0;
  color: rgb(116, 116, 116);
  /* text-transform: uppercase; */
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 230px;
}

.menu {
  flex: 1;
  display: flex;
  flex-direction: row;
  font-size: 0.9rem;
  align-items: center;
  justify-content: flex-end;
}

.menu a {
  color: rgb(134, 134, 134);
  text-decoration: none;
  text-transform: uppercase;
  margin: 0 0 0 30px;
  font-weight: 700;
}

.menu a.router-link-exact-active {
  color: var(--active-color);
}
</style>
