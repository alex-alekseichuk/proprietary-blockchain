<template>
  <div id="app">
    <TopBar />

    <router-view />
  </div>
</template>

<script>
// @ is an alias to /src
import TopBar from "@/components/TopBar.vue";

export default {
  name: "App",
  data: function () {
    return {
      passphrase: ""
    };
  },
  components: {
    TopBar
  },
  methods: {
    getUserKeys: function() {
      try {
        project.KeysService.loadKeyPairsByStrategy(this.passphrase);
      } catch (error) {
        console.error(error);
      }
    }
  },
  created() {
    this.getUserKeys();
    project.ajax.setSessionToken(localStorage.session_token);
    project.ajax.on('logout', ()=>{window.location='/'});
    project.ajax.on('401',()=>{project.ajax.logout()});
  }
};
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Nunito:300,400,600,700,900&display=swap");

:root {
  --active-color: #1a5fc7;
  --innactive-color: rgb(215, 230, 240);
  --text-color: rgb(41, 41, 41);
  --second-color: #eafae7;
}

html,
body {
  margin: 0;
  padding: 0;
  font-size: 15px;
  background-color: #eaeff4;
}

#app {
  font-family: Nunito, Helvetica, Arial, sans-serif;
  -moz-osx-font-smoothing: grayscale;
  color: #1e2429;
}
* {
  box-sizing: border-box;
}

.material-design-icon {
  position: relative;
  bottom: unset;
}

.material-design-icon > .material-design-icon__svg {
  transition: 0.2s ease-in-out all;
  position: relative !important;
  bottom: unset !important;
}

.iconButton.material-design-icon > .material-design-icon__svg {
  height: 1.6rem !important;
  width: 1.6rem !important;
  color: var(--active-color);
}

.icnButton {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  padding: 6px;
  transition: all 0.2s ease-in-out;
  fill: var(--active-color);

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  svg {
    fill: var(--active-color);
    width: 26px;
    height: 26px;
  }
}

.container {
  max-width: 960px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding: 0 10px;
  box-sizing: border-box;
}

hr {
  height: 1px;
  border: none;
}

h1 {
  margin: 0;
  font-weight: 400;
}

button {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  outline: none;
  font-weight: 600;
  padding: 0 18px;
  font-size: 0.8rem;
  border-radius: 20px;
  color: white;
  text-transform: uppercase;
  background-color: var(--active-color);
  border: 4px solid var(--innactive-color);
  cursor: pointer;
  transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) all;
  svg {
    fill: white;
    width: 18px;
    height: 18px;
    margin: 0 14px 0 0;
  }

  &:disabled {
    filter: grayscale(0.8);
    /* background-color: rgb(204, 220, 241); */
    opacity: 0.4;
  }

  &:hover {
    /* box-shadow: 0 0 10px 1px rgb(31, 255, 255); */
    background-color: rgb(57, 208, 253);
    color: white;
    /* border-color: rgb(124, 240, 255); */
    /* box-shadow: 0 0 15px 0 rgb(88, 193, 224); */
  }
}

.flex1 {
  flex: 1;
}

.flex0 {
  flex: 0;
}

#top {
  background-color: rgb(250, 250, 250);
  .header {
    padding: 15px 0 15px;

    .mainBar {
      display: flex;
      align-items: center;
      flex-direction: row;
      height: 40px;
      .iconButton {
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 6px;
        }

        &:first-child {
          margin: 0 20px 0 0;
        }
      }

      h1 {
        font-size: 1.4rem;
        margin: 0;
        flex: 0;
        white-space: nowrap;
      }

      .flex {
        flex: 1;
      }

      .headText {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        overflow: hidden;
        .subHeadText {
          border-left: 1px solid rgb(187, 187, 187);
          flex: 1;
          display: flex;
          flex-direction: column;
          border-left: 1px solid rgb(187, 187, 187);
          padding: 0 20px;
          margin: 0 0 0 20px;
          overflow: hidden;
          h2 {
            margin: 0;
            padding: 0;
            opacity: 0.9;
            font-size: 1rem;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          h3 {
            overflow: hidden;
            margin: 0;
            padding: 0;
            opacity: 0.7;
            font-size: 0.7rem;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
}

fieldset {
  display: flex;
  flex-direction: column;
  border: none;
  padding: 0;
  position: relative;
  margin: 0px 0 20px 0;
  transition: 0.2s ease-in-out all;
  &:focus-within {
    /* background: white; */
    border-color: var(--active-color);

    legend {
      color: var(--active-color);
    }
  }

  legend {
    font-size: 0.9rem;
    opacity: 1;
    text-transform: capitalize;
    color: rgb(65, 109, 155);
    font-weight: 700;
    margin: 0 0 6px 0;
  }

  input {
    /* border: none; */
    height: 44px;
    border: 1px solid rgb(175, 195, 206);
    background: white;
    padding: 0 10px;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    outline: none;
    &[disabled] {
      background-color: rgba(0, 0, 0, 0.01);
      border-color: rgb(219, 219, 219);
    }
    &:read-only {
      background-color: rgba(0, 0, 0, 0.01);
      border-color: rgb(219, 219, 219);
    }
    &:focus {
      border-color: var(--active-color);
      box-shadow: 0 0 4px 0px rgb(177, 201, 216);
      background: white;
    }
  }
}

@keyframes slideDown {
  0% {
    transform: translateY(-30px);
    opacity: 0;
  }
  100% {
    transform: translateY(0px);
    opacity: 1;
  }
}

@keyframes appear {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes zoom {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
