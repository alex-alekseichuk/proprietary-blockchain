<template>
  <div>
    <div id="top">
      <div class="container">
        <div class="header">
          <div class="mainBar">
            <h1>Contract Templates</h1>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <List
        :data="list"
        @onClick="goToTemplate"
        :columns="[
          { key: 'label', label: 'Name' },
          { key: 'version', label: 'Version' },
          { key: 'id', label: 'Id' }
        ]"
        :loading="isLoading"
      />
    </div>
  </div>
</template>

<script>
import TableList from "@/components/TableList.vue";
import List from "@/components/List.vue";
import { mapGetters } from "vuex";

export default {
  name: "TemplateExplorer",
  components: {
    TableList,
    List,
  },
  computed: mapGetters(["getInfo"]),
  data: () => {
    return {
      isLoading: false,
      list: [],
      serverUrl: "",
    };
  },
  mounted: function () {
    this.getList();
  },
  methods: {
    handleError(error){
      if(error.response){
        error.msg = error.response.message || error.response.msg
      }
      else if(error.response===null){
        error.msg = error.status +" "+error.statusText 
      }
      if(typeof error=== 'string')
      {
        error.msg = error;
      }
      this.$toast.open({
        message: (error && error.msg) || "error",
        type: "error",
      });
    },
    goToTemplate: function (item) {
      this.$router.push({
        name: `TemplateEditor`,
        params: {
          id: item.label,
          version: item.version,
        },
      });
    },
    getList: async function () {
      try {
        this.isLoading = true;
        let response = await project.ajax.get(
          this.serverUrl + "/ng-rt-smartContracts/contract-templates"
        );
        if (!response) throw new Error(xhr.statusText);
        console.log(response);
        this.list = response;
      } catch (error) {
        this.handleError(error);
      }
      finally{
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
h1 {
  margin: 40px 0 20px;
}
</style>
