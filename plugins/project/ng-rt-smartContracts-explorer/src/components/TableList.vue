<template>
  <div class="content">
    <div class="list">
      <div class="listHeader">
        <span class="id">Label</span>
        <span class="name">Id</span>
        <span class="name">Version</span>
        <!-- <span class="functions">Functions</span> -->
      </div>

      <LoadingIndicator class="center" v-if="loading" />

      <div
        class="listItem"
        v-for="item in data"
        :key="item.id"
        v-on:click="goToTemplate(item)"
      >
        <span :title="item.label" class="name">{{ item.label }}</span>
        <span :title="item.id" class="id">{{ item.id }}</span>
        <span :title="item.version" class="id">{{ item.version }}</span>
        <!-- <span class="functions">{{ item.functions }}</span> -->
      </div>
    </div>
  </div>
</template>

<script>
import LoadingIndicator from "@/components/LoadingIndicator.vue";

export default {
  name: "TableList",
  props: ["data", "loading"],
  components: {
    LoadingIndicator,
  },
  data: function () {
    return {};
  },
  methods: {
    goToTemplate: function (item) {
      this.$router.push({
        name: `TemplateEditor`,
        params: {
          id: item.label,
          version: item.version,
        },
      });
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
  /* background: rgb(253, 253, 253); */
  .listHeader {
    display: flex;
    flex-direction: row;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 700;
    color: rgb(153, 153, 153);
  }
  .id {
    flex: 1;
    min-width: 70px;
  }
  .name {
    flex: 1;
  }
  .functions {
    flex: 0;
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

  .id {
    opacity: 0.5;
  }

  .functions {
    background-color: rgb(65, 172, 65);
    border-radius: 13px;
    line-height: 26px;
    height: 26px;
    color: white;
    padding: 0 20px;
  }
}
</style>
