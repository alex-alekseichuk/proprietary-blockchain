<template>
  <div class="content">
    <div class="list">
      <div class="listHeader">
        <span v-for="(column, index) in columns" :key="index" class="id">{{
          column.label
        }}</span>
      </div>

      <LoadingIndicator class="center" v-if="loading" />

      <!-- Row -->
      <div
        class="listItem"
        v-for="item in data"
        :key="item.id"
        v-on:click="$emit('onClick', item)"
      >
        <!-- Column -->
        <span
          v-for="(column, index) in columns"
          :key="index"
          :title="item[column.key]"
          class="name"
          >{{
            column.read ? column.read(item[column.key]) : item[column.key]
          }}</span
        >
      </div>
    </div>
  </div>
</template>

<script>
import LoadingIndicator from "@/components/LoadingIndicator.vue";

export default {
  name: "List",
  props: ["data", "loading", "columns"],
  components: {
    LoadingIndicator,
  },
  data: function () {
    return {};
  },
  methods: {},
};
</script>

<style scoped lang="scss">
.content {
  padding: 30px 0 20px 0;
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

  & > span {
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 10px 0 0;
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
