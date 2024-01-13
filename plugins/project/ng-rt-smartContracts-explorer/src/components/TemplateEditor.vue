<template>
  <div class="content">
    <LoadingIndicator class="center" v-if="loading" />
    <div class="templateContainer">
      <div class="topBorder"></div>
      <div v-if="owner || template || timestamp" class="top">
        <div class="ownerCircle" v-if="owner && owner[0]"></div>
        <div class="infoBox" v-if="owner && owner[0]">
          <div class="infoBoxLabel">
            owner
            <div class="ownerType" v-if="ownerDetails.type">
              {{ ownerDetails.type }}
            </div>
          </div>
          <span :title="owner && owner[0]" class="infoBoxValue">
            <span v-if="ownerDetails.fullname" class="ownerName">{{
              ownerDetails.fullname
            }}</span>
            <span>{{ owner && owner[0] }}</span>
            <div
              class="copytip"
              v-on:click.stop="copyTextToClipboard(owner[0])"
            >
              <Copy />
            </div>
          </span>
        </div>

        <div class="infoBox" v-if="template">
          <div class="infoBoxLabel">template</div>
          <div :title="template" class="infoBoxValue">
            <span>{{ template }}</span>
          </div>
        </div>

        <div class="flex1"></div>
        <div class="infoBox" v-if="timestamp">
          <div class="infoBoxLabel"><Time />timestamp</div>
          <div class="infoBoxValue">
            <span>{{ formatDate(timestamp) }}</span>
          </div>
        </div>
      </div>

      <div v-if="initState" class="initState">
        <span>State</span>
        {{ JSON.stringify(initState, null, 4) }}
      </div>

      <div
        class="descriptionTemplate"
        v-if="description && description.length > 0"
      >
        <Info />
        <div>{{ trim(description) }}</div>
      </div>

      <div class="tabsContainer">
        <h3>Functions</h3>

        <div class="tabs">
          <span
            v-bind:class="{ current: activeFunction === index }"
            v-for="(item, index) in functions"
            :key="index"
            v-on:click="setActiveFunction(index)"
          >
            <div
              v-if="item && item.functionArgs && item.functionArgs.length > 0"
              class="counter"
            >
              {{ item.functionArgs.length }}
            </div>
            <div
              v-if="item && item.name.startsWith('transfer')"
              class="counter"
            >
              {{ Object.keys(transferArgs).length }}
            </div>
            <div class="tabHead" :title="item.name">
              <!-- <chevron-right /> -->
              {{ item.name }}
            </div>
            <div class="tabBottom">
              {{
                (item && item.functionArgs && item.functionArgs.length > 0) ||
                item.name.startsWith("transfer")
                  ? "arguments"
                  : "no arguments"
              }}
            </div>
          </span>
        </div>

        <div class="tabContent">
          <div class="warning" v-if="!instance && activeFunction !== 0">
            <Info />Only the 'init' function can be used in order to create a
            contract instance.
          </div>
          <div class="warning" v-else-if="instance && activeFunction === 0">
            <Info />The 'init' function can't be used on a contract instance.
          </div>

          <div
            v-if="activeFunctionDetails && activeFunctionDetails.description"
            class="description"
          >
            {{ activeFunctionDetails.description }}
          </div>

          <div v-if="activeArguments" class="argumentsBlock">
            <h3>Arguments</h3>
            <div class="inputs">
              <fieldset
                v-for="(item, index) in functions[activeFunction].functionArgs"
                :key="index"
              >
                <legend>{{ item }}</legend>

                <input v-model="args[index]" :disabled="canEdit" />
              </fieldset>
            </div>

            <button
              style="margin: 0 0px 0px 20px;"
              v-on:click="publish()"
              v-if="!instance && activeFunction === 0"
            >
              <Publish />Publish
            </button>

            <button
              v-if="instance && activeFunction !== 0"
              style="margin: 0 0 0 15px;"
              v-on:click="callFunction()"
            >
              <Call />Call
            </button>
          </div>
          <div class="noArguments" v-else-if="!activeArguments && !isTransfer">
            Function without arguments
            <button
              v-if="instance && activeFunction !== 0"
              style="margin: 15px 0 0 0;"
              v-on:click="callFunction()"
            >
              <Call />Call
            </button>
          </div>
          <div class="argumentsBlock" v-if="isTransfer">
            <h3>Arguments</h3>
            <div class="inputs">
              <fieldset>
                <legend>AssetId</legend>
                <input
                  v-model.lazy="transferArgs.assetId"
                  :disabled="canEdit"
                />
              </fieldset>
              <fieldset>
                <legend>Next Owner</legend>
                <input v-model="transferArgs.nextOwner" :disabled="canEdit" />
              </fieldset>
              <fieldset>
                <legend>Amount</legend>
                <input
                  v-model.number="transferArgs.amount"
                  value="1"
                  :disabled="canEdit"
                />
              </fieldset>
            </div>
            <button
              style="margin: 0 0 0 15px;"
              v-if="instance && activeFunction !== 0"
              v-on:click="transferFunction()"
            >
              <Transfer />Transfer
            </button>
          </div>
        </div>
        <!-- Instance footer -->
        <div class="footerStatus" v-if="activeFunction !== 0 && result">
          <h1>result</h1>
          <span class="resultView">
            {{
              JSON.stringify(
                result && result.result ? result.result : result,
                null,
                4
              )
            }}
          </span>
        </div>

        <div v-if="published" class="templateFooter">
          Contract published
          <span class="instanceLink" v-on:click="goToInstance(published)"
            >Open Instance</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import LoadingIndicator from "@/components/LoadingIndicator.vue";

import Copy from "@/components/icons/Copy";
import Refresh from "@/components/icons/Refresh";
import Publish from "@/components/icons/Publish";
import Time from "@/components/icons/Time";
import Call from "@/components/icons/Call";
import Transfer from "@/components/icons/Transfer";
import Instances from "@/components/icons/Instances";
import Info from "@/components/icons/Info";

export default {
  name: "TemplateEditor",
  components: {
    LoadingIndicator,
    Refresh,
    Publish,
    Info,
    Call,
    Instances,
    Time,
    Copy,
    Transfer,
  },
  props: [
    "functions",
    "owner",
    "timestamp",
    "template",
    "description",
    "instance",
    "published",
    "loading",
    "initState",
    "callResult",
  ],
  data: () => {
    return {
      ownerDetails: {},
      args: [],
      result: null,
      activeFunction: 0,
      serverUrl: "",
      clientSigning: true,
      transferArgs: {
        assetId: "",
        nextOwner: false,
        amount: 1,
      },
    };
  },
  computed: {
    activeFunctionDetails() {
      if (this.functions && this.functions[this.activeFunction]) {
        return this.functions[this.activeFunction];
      }
    },
    activeArguments() {
      return (
        this.functions &&
        this.functions[this.activeFunction] &&
        this.functions[this.activeFunction].functionArgs &&
        this.functions[this.activeFunction].functionArgs.length > 0
      );
    },
    canEdit() {
      return this.instance
        ? this.activeFunction === 0
        : this.activeFunction !== 0;
    },
    isTransfer() {
      if (this.functions && this.functions[this.activeFunction]) {
        return this.functions[this.activeFunction].name.startsWith("transfer");
      }
    },
  },
  mounted() {
    this.getOwner();
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
    async getOwner() {
      let publicKey;
      if (!this.owner || (this.owner && !this.owner[0])) return;

      let response = await project.ajax.get(
        this.serverUrl +
          "/ng-rt-smartContracts/getUserInformationByPublicKey/" +
          this.owner[0]
      );

      this.ownerDetails = {
        type: response.type,
        fullname: response.fullname,
      };
    },
    formatDate(value) {
      return moment(value).format("HH:mm DD.MM.YYYY");
    },
    trim(value) {
      let text = value;
      text.trim();
      return text;
    },
    setActiveFunction: function (value) {
      this.activeFunction = value;
      this.args = [];
      this.result = null;
      this.$emit("onFunctionSet", value);
    },

    goToInstance: function (id) {
      this.$router.push(`/instance/${id}`);
    },
    publish: async function (id) {
      try {
        this.$emit("onLoading", true);
        if (this.args.length < 1) return;
        let args = this.args.join("@");
        let keypair;
        this.userKeys = this.$project.KeysService.getDefault();
        if (this.userKeys.prvkey.length > 32) {
          keypair = this.$project.digitalAsset.driver.extractKeys(
            this.userKeys.prvkey
          );
        } else {
          keypair = {
            publicKey: this.userKeys.pubkey,
            privateKey: this.userKeys.prvkey,
          };
        }
        const body = {
          clientSigning: this.clientSigning,
          args: args,
          pubKey: keypair.publicKey,
        };

        let response = await this.$project.ajax.post(
          this.serverUrl +
            "/ng-rt-smartContracts/contracts/" +
            this.$route.params.id,
          body
        );
        if (this.clientSigning) {
          const tx = this.$project.digitalAsset.driver.signTx(
            response,
            keypair.privateKey
          );
          const assetFormat = this.$project.digitalAsset.driver.getSdkInfo();
          let postTxBody = {
            assetType: "smartContract",
            tx,
            ownerPublicKey: keypair.publicKey,
            isSigned: true,
            txMethod: "Commit",
            assetFormat,
            keySource: "externalPublicKey",
          };

          let postResponse = await this.$project.ajax.post(
            this.serverUrl + "/ng-rt-digitalAsset/assets/",
            postTxBody
          );
          if (postResponse && postResponse.result && postResponse.result.hash)
            this.$emit("onPublish", postResponse.result.hash);
        } else {
          if (response && response.result && response.result.hash)
            this.$emit("onPublish", response.result.hash);
        }
      } catch (error) {
        this.handleError(error);
      } finally {
        this.$emit("onLoading", false);
      }
    },
    callFunction: async function (id) {
      try {
        let self = this;
        this.result = null;
        this.$emit("onLoading", true);
        if (this.args.length < 1) {
          this.args = "";
        } else {
          this.args.join("@");
        }

        this.contractId = this.$route.params.id;
        this.functionName = this.functions[this.activeFunction].name;
        let keypair;
        let defaultKeys = this.$project.KeysService.getDefault();

        if (defaultKeys.prvkey.length > 32) {
          keypair = this.$project.digitalAsset.driver.extractKeys(
            defaultKeys.prvkey
          );
        } else {
          keypair = {
            publicKey: defaultKeys.pubkey,
            privateKey: defaultKeys.prvkey,
          };
        }
        const body = {
          clientSigning: this.clientSigning,
          args: JSON.stringify(this.args),
          pubKey: keypair.publicKey,
        };
        let response = await this.$project.ajax.post(
          this.serverUrl +
            "/ng-rt-smartContracts/contracts/call/" +
            this.contractId +
            "/" +
            this.functionName,
          body
        );
        console.log("callFunction");
        console.log("callFunction response", response);
        if (
          this.clientSigning &&
          this.args !== "" &&
          response.hasOwnProperty("tx")
        ) {
          const responseMemory = response.result.memory;
          const tx = this.$project.digitalAsset.driver.signTx(
            response.tx,
            keypair.privateKey
          );
          const assetFormat = this.$project.digitalAsset.driver.getSdkInfo();
          let postTxBody = {
            assetType: "smartContract",
            tx,
            ownerPublicKey: keypair.publicKey,
            isSigned: true,
            txMethod: "Commit",
            assetFormat,
            keySource: "externalPublicKey",
          };

          let postResponse = await this.$project.ajax.post(
            this.serverUrl + "/ng-rt-digitalAsset/assets/",
            postTxBody
          );
          if (postResponse.tx) {
            this.result = {
              hash: postResponse.tx.result.hash,
              memory: postResponse.result.memory,
            };
          } else if (postResponse.result) {
            this.result = {
              hash: postResponse.result.hash,
              memory: responseMemory,
            };
          } else this.result = postResponse;
          this.$emit("onCall", postResponse);
        } else {
          if (response.tx) {
            this.result = {
              hash: response.tx.result.hash,
              memory: response.result.memory,
            };
          } else if (response.result) this.result = response;
          else this.result = response;
          this.$emit("onCall", response);
        }
      } catch (error) {
        this.handleError(error);
      } finally {
        this.$emit("onLoading", false);
      }
    },
    transferFunction: async function (id) {
      try {
        let self = this;
        this.$emit("onLoading", true);
        if (this.args.length < 1) {
          this.args = "";
        } else {
          this.args.join("@");
        }

        this.contractId = this.$route.params.id;
        this.functionName = this.functions[this.activeFunction].name;
        let keypair;
        let defaultKeys = this.$project.KeysService.getDefault();

        if (defaultKeys.prvkey.length > 32) {
          keypair = this.$project.digitalAsset.driver.extractKeys(
            defaultKeys.prvkey
          );
        } else {
          keypair = {
            publicKey: defaultKeys.pubkey,
            privateKey: defaultKeys.prvkey,
          };
        }
        const body = {
          args: JSON.stringify(this.args),
          assetId: this.transferArgs.assetId,
          pubKey: keypair.publicKey,
          clientSigning: this.clientSigning,
          nextOwner: this.transferArgs.nextOwner,
          amount: this.transferArgs.amount,
          latestTxId: this.transferArgs.latestTxId
            ? this.transferArgs.latestTxId
            : this.transferArgs.assetId,
        };
        let response = await this.$project.ajax.post(
          this.serverUrl +
            "/ng-rt-smartContracts/contracts/transferCall/" +
            this.contractId +
            "/" +
            this.functionName,
          body
        );
        console.log("TransferFunction response", response);
        if (this.clientSigning && response.hasOwnProperty("transferTxId")) {
          const responseMemory = response.result.memory;
          const tx = this.$project.digitalAsset.driver.signTx(
            response.transferTxId,
            keypair.privateKey
          );
          const assetFormat = this.$project.digitalAsset.driver.getSdkInfo();
          let postTxBody = {
            assetType: "smartContract",
            tx,
            ownerPublicKey: keypair.publicKey,
            isSigned: true,
            txMethod: "Commit",
            assetFormat,
            keySource: "externalPublicKey",
          };

          let postResponse = await this.$project.ajax.post(
            this.serverUrl + "/ng-rt-digitalAsset/assets/",
            postTxBody
          );
          if (postResponse.tx) {
            this.result = {
              hash: postResponse.tx.result.hash,
              memory: postResponse.result.memory,
            };
          } else if (postResponse.result) {
            this.result = {
              hash: postResponse.result.hash,
              memory: responseMemory,
            };
          } else this.result = postResponse;
        } else {
          if (response.tx) {
            this.result = {
              hash: response.tx.result.hash,
              memory: response.result.memory,
            };
          } else if (response.result) this.result = response;
          else this.result = response;
        }
      } catch (error) {
        this.handleError(error);
      } finally {
        this.$emit("onLoading", false);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.content {
  padding: 20px 0 20px 0;
}

.input {
  margin: 0 10px 0 0;
}

.infoIcon {
  align-self: flex-start;
  opacity: 0.2;
  color: var(--active-color);
  opacity: 0.2;
  font-size: 2.8rem;
}

.topBorder {
  height: 6px;
  margin: 0 0 10px 0;
  opacity: 0.2;
  background-color: var(--active-color);
}

.ownerCircle {
  width: 40px;
  min-width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgb(221, 221, 221);
  margin: 0 20px 0 0;
}

.infoBox {
  display: flex;
  flex-direction: column;
  padding: 0 20px 0 0;
  min-width: 150px;
  .infoBoxLabel {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.8rem;
    opacity: 0.8;
    margin: 0 0 5px 0;
    text-transform: capitalize;
    display: flex;
    flex-direction: row;
    align-items: center;
    .ownerType {
      margin: 0 10px;
      height: 20px;
      font-weight: 500;
      border-radius: 10px;
      line-height: 20px;
      padding: 0 15px;
      font-weight: 700;
      color: black;
      background-color: #d2dff4;
    }
    svg {
      width: 15px;
      height: 15px;
      margin: 0 10px 0 0;
      fill: var(--text-color);
    }
    .copytip {
      display: flex;
      opacity: 1;
      margin: 0 0 0 10px;
      svg {
        width: 15px;
        height: 15px;
        fill: var(--active-color);
      }
      box-shadow: none;
    }
  }
  .infoBoxValue {
    text-overflow: ellipsis;
    font-size: 1rem;
    position: relative;
    display: flex;
    flex-direction: row;

    .ownerName {
      padding: 0 10px 0 0;
      margin: 0 10px 0 0px;
      border-right: 1px solid rgba(0, 0, 0, 0.1);
    }
    & > span {
      text-overflow: ellipsis;
      overflow: hidden;
    }
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
      height: 26px;
      width: 26px;
      bottom: 0;
      border-radius: 4px;
      /* transform: translateY(-50%); */
      padding: 6px;
      background-color: white;
      justify-content: center;
      align-items: center;
      box-shadow: 0 3px 2px 0 rgba(0, 0, 0, 0.2);
      /* animation: 0.2s zoom cubic-bezier(0.68, -0.6, 0.32, 1.6); */
      svg {
        fill: rgb(131, 131, 131);
      }
    }
  }
}

.templateContainer {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 0 0px;
  border-radius: 5px;
  margin: 20px 0 20px 0;
  box-shadow: 0 5px 10px 1px rgba(11, 11, 37, 0.03);
  overflow: hidden;
  animation: zoom 0.3s cubic-bezier(0.68, -0.6, 0.32, 1.6);

  .top {
    padding: 10px 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .header {
    line-height: 50px;
    height: 50px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-weight: 500;
    font-size: 1.1rem;
    display: flex;
    flex-direction: row;
    padding: 0 20px;
    .name {
      flex: 1;
    }

    .headId {
      flex: 0;
    }
  }

  .initState {
    padding: 20px;
    display: flex;
    white-space: pre;
    flex-direction: column;
    background-color: rgb(245, 243, 228);
    animation: slideDown 0.2s ease-in-out;
    span {
      font-size: 0.8rem;
      margin: 0 0 5px 0;
      opacity: 0.8;
    }
  }

  .descriptionTemplate {
    padding: 20px 20px 20px 20px;
    display: flex;
    flex-direction: row;
    font-size: 0.9rem;
    opacity: 0.9;
    align-items: center;
    white-space: pre-wrap;
    svg {
      width: 30px;
      height: 30px;
      fill: var(--text-color);
      align-self: flex-start;
      opacity: 0.3;
    }
    div {
      margin: 0 0 0 20px;
    }
    h2 {
      margin: 0 0 10px 0;
      font-size: 0.9rem;
      font-weight: 400;
      opacity: 0.8;
    }
  }

  .tabsContainer {
    display: flex;
    flex-direction: column;
    padding: 10px 0 0 0;
    border-top: 1px solid rgba(0, 0, 0, 0.05);

    h3 {
      margin: 10px 20px 10px 20px;
      font-size: 1rem;
      opacity: 0.6;
      font-weight: 500;
    }
  }

  .tabs {
    /* direction: rtl; */
    display: flex;
    flex-direction: row;
    padding: 0px 20px 0px 20px;
    position: relative;
    overflow-x: auto;

    &::before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      opacity: 0.2;
      background-color: var(--active-color);
      z-index: 2;
    }

    span {
      z-index: 3;
      min-height: 70px;
      min-width: 150px;
      border-bottom: 2px solid transparent;
      border-radius: 5px 5px 0 0;
      display: flex;
      flex-direction: column;
      padding: 10px 10px 10px 10px;
      color: var(--text-color);
      justify-content: space-between;
      margin: 0 10px 0px 0;
      transition: 0.3s ease-in-out all;
      cursor: pointer;
      opacity: 0.8;
      position: relative;
      &.current {
        opacity: 1;
        background: linear-gradient(
          180deg,
          rgb(249, 252, 255) 90%,
          rgb(249, 252, 255) 100%
        );
        border-color: var(--active-color);
        .tabHead {
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--active-color);
        }

        .counter {
          opacity: 1;
          color: var(--active-color);
        }
      }
      &:hover {
        border-color: var(--active-color);
      }
      .counter {
        position: absolute;
        bottom: 6px;
        right: 6px;
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        /* background-color: none; */
        color: var(--text-color);
        opacity: 0.6;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0 5px;
      }
      .tabHead {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-weight: 700;
        .material-design-icon {
          font-size: 1.6rem;
          margin: 0 5px 0 -15px;
          color: var(--active-color);
          padding: 0;
          min-width: 10px;
          width: 10px;
          height: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }

      .tabBottom {
        font-size: 0.9rem;
        opacity: 0.5;
      }
    }
  }

  .tabContent {
    margin: 0px 0px 0px 0px;
    padding: 10px 0px 20px 0px;
    /* border-radius: 0 0 7px 7px; */
    background: linear-gradient(0deg, #f6f7f9 95%, #f3f4f5);

    .warning {
      padding: 10px;
      border-radius: 4px;
      opacity: 0.7;
      font-size: 0.9rem;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      border: 1px solid rgba(0, 0, 0, 0.1);
      margin: 10px 20px 0 20px;
      align-items: center;

      svg {
        width: 15px;
        height: 15px;
        fill: var(--text-color);
        opacity: 0.5;
        margin: 0 10px 0 0;
      }
    }
    .description {
      padding: 20px 20px;
    }

    h3 {
      font-weight: 400;
      font-size: 1.1rem;
      margin: 20px 20px 20px 20px;
    }

    .argumentsBlock {
      animation: slideDown 0.2s cubic-bezier(0.68, -0.6, 0.32, 1.6);
    }

    .noArguments {
      padding: 20px 20px 0 20px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
    }

    .arguments {
      display: flex;
      flex-direction: row;
      padding: 0px 20px 20px 20px;

      span {
        height: 30px;
        line-height: 30px;
        border-radius: 15px;
        background-color: var(--active-color);
        color: white;
        padding: 0 20px;
        margin: 0 10px 0 0;
      }
    }
  }
  .templateFooter {
    margin: 0px 0 0 0;
    background: #eafae7;
    padding: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    animation: slideDown 0.2s ease-in-out;
    .instanceLink {
      color: rgb(83, 142, 253);
      font-weight: 600;
      margin: 0 0 0 10px;
      &:hover {
        text-decoration: underline;
        cursor: pointer;
      }
    }
  }

  .footerStatus {
    margin: 0px 0 0 0;
    background: var(--second-color);
    padding: 0 20px 30px 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    h1 {
      align-self: flex-end;
      box-sizing: border-box;
      border: 4px solid #f3f4f5;
      margin: -20px 0 20px 0;
      padding: 0;
      font-size: 1rem;
      background-color: var(--second-color);
      font-weight: 700;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 20px;
      padding: 0 40px;
      color: rgb(32, 90, 71);
      width: auto;
    }
    .resultView {
      flex: 1;
      white-space: pre;
    }
  }

  .instanceLink {
    color: var(--active-color);
    font-weight: 600;
    margin: 0 0 0 10px;
    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .inputs {
    display: flex;
    flex-direction: column;
    padding: 0 20px;
  }
}
</style>
