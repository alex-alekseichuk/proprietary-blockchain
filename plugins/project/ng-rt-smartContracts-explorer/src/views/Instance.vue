<template>
  <div>
    <div id="top">
      <div class="container">
        <div class="header">
          <div class="mainBar">
            <arrow-left class="iconButton" v-on:click="goBack()" />

            <div class="headText">
              <h1>Contract Instance</h1>
              <div class="subHeadText">
                <h2 :title="this.$route.params.id">
                  <div class="copytip" v-on:click.stop="copyTextToClipboard()">
                    <Copy />
                  </div>
                  {{ this.$route.params.id }}
                </h2>
                <h3 v-if="version">V&nbsp;{{ version }}</h3>
              </div>
            </div>
            <button style="margin: 0 0 0 15px;" v-on:click="getState">
              <Refresh />GET STATE
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <TemplateEditor
        v-if="owner"
        ref="templateEditor"
        @onCall="onCalled"
        @onLoading="setLoading"
        @onFunctionSet="functionSet"
        :owner="owner"
        :template="template"
        :timestamp="timestamp"
        :description="description"
        :functions="functions"
        :instance="true"
        :loading="isLoading"
        :initState="initState"
      />
    </div>
  </div>
</template>

<script>
import TemplateEditor from "@/components/TemplateEditor.vue";
import Copy from "@/components/icons/Copy";
import Refresh from "@/components/icons/Refresh";

export default {
  name: "Instance",
  components: {
    TemplateEditor,
    Copy,
    Refresh,
  },
  data: () => {
    return {
      isLoading: false,
      owner: "",
      timestamp: "",
      version: "",
      description: "",
      functions: [],
      activeFunction: 0,
      template: "",
      initState: "",
      serverUrl: "",
      callUrl: "/ng-rt-smartContracts/contracts/app/call",
    };
  },
  mounted: function () {
    this.getData();
  },
  methods: {
    handleError(error) {
      if (error.response) {
        error.msg = error.response.message || error.response.msg;
      } else if (error.response === null) {
        error.msg = error.status + " " + error.statusText;
      }
      if (typeof error === "string") {
        error.msg = error;
      }
      this.$toast.open({
        message: (error && error.msg) || "error",
        type: "error",
      });
    },
    copyTextToClipboard() {
      let text = this.$route.params.id;
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
    onCalled() {
      // this.getState();
    },
    functionSet(value) {
      this.activeFunction = value;
    },
    setLoading: function (value) {
      this.isLoading = value;
    },
    callFunction: function () {
      this.$refs.templateEditor.callFunction();
    },
    goBack: function (id) {
      this.$router.push(`/instances`);
    },
    getData: async function () {
      try {
        this.isLoading = true;
        let response = await project.ajax.get(
          this.serverUrl +
            "/ng-rt-smartContracts/contracts/" +
            this.$route.params.id
        );
        console.log("instance --->", response);
        console.log("functions", response.mappedFunctionsAndArguments);
        this.owner = response.contractOwner;
        this.description = response.contractDescription;
        this.functions = response.mappedFunctionsAndArguments;
        this.timestamp = response.publishedOn;
      } catch (error) {
        this.handleError(error);
      } finally {
        this.isLoading = false;
      }
    },
    getState: async function () {
      try {
        this.isLoading = true;
        let response = await project.ajax.get(
          this.serverUrl +
            "/ng-rt-smartContracts/contracts/" +
            this.$route.params.id +
            "/state"
        );
        console.log("state --->", response);
        this.initState = response;
      } catch (error) {
        this.handleError(error);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.subHeadText {
  h2 {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;

    .copytip {
      display: flex;
      opacity: 1;
      margin: 0 10px 0 0;
      width: 15px;
      height: 15px;
      svg {
        width: 15px;
        height: 15px;
        fill: var(--active-color);
      }
      box-shadow: none;
    }
  }
}
</style>
