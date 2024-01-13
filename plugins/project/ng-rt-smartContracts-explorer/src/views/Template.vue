<template>
  <div>
    <div id="top">
      <div class="container">
        <div class="header">
          <div class="mainBar">
            <arrow-left class="iconButton" v-on:click="goBack()" />
            <div class="headText">
              <h1>Contract Template</h1>
              <div class="subHeadText">
                <h2 :title="this.$route.params.id">{{ this.$route.params.id }}</h2>
                <h3 v-if="version">V&nbsp;{{ version }}</h3>
              </div>
            </div>

            <div v-if="instances.length > 0">
              <button style="margin: 0 0 0 15px;" v-on:click="goInstances()">
<!--             <Instances /> Check: is this needed? -->
                  Instances {{ instances.length }}
              </button>
            </div>
            <div v-else>NO INSTANCES</div>
          </div>
        </div>
      </div>
    </div>
    <div class="container" v-show="instanceClicked===false">
      <TemplateEditor
        ref="templateEditor"
        @onFunctionSet="functionSet"
        @onPublish="onPublished"
        :loading="isLoading"
        :functions="functions"
        :description="description"
        :published="published"
      />
    </div>
    <div class="container" v-show="instanceClicked===true">
      <List
        :data="instances"
        @onClick="listItemClick"
        :columns="[
          { key: 'contractId', label: 'Contract Id' },
          { key: 'contractOwner', label: 'Owner', read: (value) => value[0] },
          {
            key: 'createdOn',
            label: 'Date',
            read: (value) => formatDate(value),
          },
        ]"
        :loading="isLoading"
      />
    </div>
  </div>
</template>

<script>
import Instances from "@/components/icons/Instances";
import TemplateEditor from "@/components/TemplateEditor.vue";
import LoadingIndicator from "@/components/LoadingIndicator.vue";
import Back from "@/components/icons/Back.vue";
import List from "@/components/List.vue";
import moment from "moment";

export default {
  name: "Template",
  components: {
    TemplateEditor,
    Instances,
    Back,
    List,
  },
  computed: {
    getInfo() {
      return this.$store.getters.getInfo;
    }
  },
  data: () => {
    return {
      isLoading: false,
      instances: [],
      description: "",
      version: null,
      published: false,
      result: {},
      functions: [],
      templateName: "",
      serverUrl: "",
      activeFunction: 0,
      instanceClicked: false,
    };
  },
  mounted: function() {
    this.getData();
    this.getInstances();
    this.version = this.$route.params.version;
    this.templateName = this.$route.params.id;
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
    formatDate(value) {
      return moment(value).format("HH:mm DD.MM.YYYY");
    },
    listItemClick(value) {
      this.$router.push(`/instance/${value.contractId}`);
    },
    functionSet(value) {
      this.activeFunction = value;
    },
    onPublished(hash) {
      this.published = hash;
    },
    getData: async function() {
      try {
        this.isLoading = true;
        let response = await project.ajax.get(
          this.serverUrl +
            "/ng-rt-smartContracts/contract-templates/" +
            this.$route.params.id +
            `?version=${this.$route.params.version}`);
            console.log("contractdetails --->", response);
            this.description = response.contractDescription;
            this.functions = response.mappedFunctionsAndArguments;
      } catch (error) {
        this.handleError(error);
      }
      finally {
        this.isLoading = false;
      }
    },
    goBack: function(id) {
      this.$router.push("/");
    },
    goInstances: function(id) {
      this.instanceClicked = true;
    },
    getInstances: async function() {
      try {
        this.isLoading = true;
        let response = await project.ajax.get(
          this.serverUrl +
            `/ng-rt-smartContracts/contracts/${this.$route.params.id}/instances?version=${this.$route.params.version}`);
          console.log("state --->", response);
          this.instances = response;
      } catch (error) {
       this.handleError(error);
      }
      finally{
        this.isLoading = false;
      }
    },
    publish: function() {
      this.$refs.templateEditor.publish();
    }
  }
};
</script>

<style scoped lang="scss">
.details {
}
</style>
