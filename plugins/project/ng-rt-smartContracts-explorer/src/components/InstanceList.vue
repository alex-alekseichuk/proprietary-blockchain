<template>
  <div class="content">
    <div class="list">
      <div class="listHeader">
        <span class="idColumn">id</span>
        <span class="ownerColumn">Owner</span>
        <span class="timestampColumn">Date</span>
      </div>

      <LoadingIndicator class="center" v-if="loading" />

      <div
        class="listItem"
        v-for="item in data"
        :key="item.contractId"
        v-on:click="goTo(item.contractId)"
      >
        <span :title="item.contractId" class="idColumn"
          >{{ item.contractId }}
          <div
            class="copytip"
            v-on:click.stop="copyTextToClipboard(item.contractId)"
          >
            <Copy />
          </div>
        </span>
        <span :title="item.contractOwner[0]" class="ownerColumn"
          >{{ item.contractOwner[0] }}
          <div
            class="copytip"
            v-on:click.stop="copyTextToClipboard(item.contractOwner[0])"
          >
            <Copy />
          </div>
        </span>
        <span :title="formatDate(item.createdOn)" class="timestampColumn">{{
          formatDate(item.createdOn)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";

import Copy from "./icons/Copy";

import LoadingIndicator from "@/components/LoadingIndicator.vue";

export default {
  name: "InstanceList",
  props: ["data", "loading"],
  components: {
    LoadingIndicator,
    Copy,
  },
  data: function () {
    return {
      filtering: false,
    };
  },
  methods: {
    copyTextToClipboard(text) {
      var textArea = document.createElement("textarea");
      textArea.style.position = "fixed";
      textArea.style.top = 0;
      textArea.style.left = 0;
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = 0;
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        var successful = document.execCommand("copy");
        var msg = successful ? "successful" : "unsuccessful";
        console.log("Copying text command was " + msg);
      } catch (err) {
        console.log("Oops, unable to copy");
      }

      document.body.removeChild(textArea);
      this.$toast.open({
        message: "Copied to clipbloard",
        type: "success",
      });
    },
    formatDate(value) {
      return moment(value).format("HH:mm DD.MM.YYYY");
    },
    goTo: function (id) {
      this.$router.push(`/instance/${id}`);
    },
  },
};
</script>

<style scoped lang="scss">
.content {
  padding: 30px 0 20px 0;
}

.input {
  margin: 0 10px 0 0;
}

.list {
  border-radius: 3px;
  span {
    padding: 0 10px;
  }
  .listHeader {
    display: flex;
    flex-direction: row;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 700;
    color: rgb(153, 153, 153);
  }
  .idColumn {
    flex: 1;
    position: relative;
  }

  .ownerColumn {
    flex: 1;
  }

  .timestampColumn {
    flex: 1;
    max-width: 200px;
    min-width: 150px;
  }
}

.listItem {
  box-shadow: 0 4px 6px 1px rgba(0, 0, 0, 0.1);
  height: 50px;
  display: flex;
  flex-direction: row;
  background: rgb(253, 253, 253);
  align-items: center;
  padding: 0 20px;
  border-radius: 3px;
  margin: 0 0 1px 0;
  overflow: hidden;
  transition: 0.3s ease-in-out all;
  cursor: pointer;

  &:hover {
    background-color: rgb(242, 248, 250);
  }
  > span {
    line-height: 50px;
    height: 50px;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    &:hover {
      .copytip {
        display: flex;
        opacity: 1;
      }
    }
    .copytip {
      display: none;
      opacity: 0;
      position: absolute;
      right: 10px;
      height: 30px;
      width: 30px;
      top: 50%;
      border-radius: 4px;
      transform: translateY(-50%);
      padding: 6px;
      background-color: white;
      justify-content: center;
      align-items: center;
      box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.2);
      /* animation: 0.2s zoom cubic-bezier(0.68, -0.6, 0.32, 1.6); */
      svg {
        fill: var(--active-color);
      }
    }
  }
}
</style>
