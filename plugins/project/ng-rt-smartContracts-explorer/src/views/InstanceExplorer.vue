<template>
  <div>
    <div id="top">
      <div class="container">
        <div class="header">
          <div class="mainBar">
            <arrow-left
              v-if="this.$route.query.version"
              class="iconButton"
              v-on:click="goBack()"
            />
            <div class="headText">
              <h1>Contract Instances</h1>
              <div v-if="this.$route.query.version" class="subHeadText">
                <h2>{{ this.$route.params.id }}</h2>
                <h2>{{ this.$route.query.version }}</h2>
              </div>
            </div>

            <button
              v-on:click="setFilter()"
              v-if="!templateInstances && !filtering"
            >
              <Filter />Filter
            </button>
            <button v-on:click="setFilter()" v-if="filtering">
              Close filter
            </button>
          </div>
          <div class="searchInstance" v-if="filtering">
            <div class="inputs">
              <fieldset>
                <legend>Contract Id</legend>
                <input v-model="contractId" />
              </fieldset>
              <fieldset>
                <legend>Owner</legend>
                <input v-model="owner" />
              </fieldset>
              <fieldset>
                <legend>Sort by date</legend>

                <select
                  v-model="sortBy"
                  @change.capture="selectChange($event, i)"
                >
                  <option
                    v-for="item in sorting"
                    :key="item.value"
                    :value="item.value"
                    >{{ item.title }}</option
                  >
                </select>
              </fieldset>
              <button @click="getFilter" style="margin: 20px 0 0 0;">
                <Filter />Filter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <List
        :data="list"
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
      <!-- <InstanceList :data="list" :loading="isLoading" /> -->
    </div>
  </div>
</template>

<script>
import InstanceList from "@/components/InstanceList.vue";
import List from "@/components/List.vue";
import Filter from "@/components/icons/Filter";
import moment from "moment";

export default {
  name: "Contract Instances",
  components: {
    InstanceList,
    List,
    Filter,
  },
  data: function () {
    return {
      owner: "",
      sorting: [
        { title: "Ascending", value: "ASC" },
        { title: "Descending", value: "DESC" },
      ],
      sortBy: "DESC", // default to newest
      contractId: "",
      isLoading: false,
      list: [],
      filtering: false,
      serverUrl: "",
      limit: 20,
      offset: 0,
    };
  },
  computed: {
    templateInstances() {
      return this.$route.name === "TemplateInstances";
    },
  },
  mounted: async function () {
    console.log("this.$route.query.version", this.$route.query.version);
    this.list = await this.getList(this.offset);
  },
  created() {
    window.addEventListener("scroll", this.handleScroll);
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    handleError(error){
      if(error.response){
        error.msg = error.response.message || error.response.msg
      }
      else if(error.response===null){
        error.msg = error.status +" "+error.statusText 
      }
      this.$toast.open({
        message: (error && (error.msg || error.message)) || "error",
        type: "error",
      });
    },
    getFilter: async function () {
      this.list = [];
      this.offset = 0;
      this.list = await this.getList(this.offset, this.limit);
    },
    handleScroll: async function () {
      try {
        let bottomOfWindow =
          document.documentElement.scrollTop + window.innerHeight ===
          document.documentElement.offsetHeight;
        if (bottomOfWindow && this.isLoading === false) {
          this.offset = this.limit + this.offset;
          let result = await this.getList(this.offset);
          if (result.length > 0) {
            this.list = this.list.concat(result);
          }
          else {
            window.removeEventListener("scroll", this.handleScroll);
            throw new Error('No more instances found');
          }
        }
      } catch (error){
        this.handleError(error); 
      }
      finally{
        this.isLoading = false;
      }
    },
    listItemClick(value) {
      console.log("click");
      console.log(value);
      this.$router.push(`/instance/${value.contractId}`);
    },
    formatDate(value) {
      return moment(value).format("HH:mm DD.MM.YYYY");
    },
    goBack() {
      this.$router.go(-1);
    },
    selectChange(e, index) {
      this.sortBy = e.target.value;
    },
    setFilter: function () {
      this.filtering = !this.filtering;
    },
    getList: async function (offset, limit) {
      try {
        this.isLoading = true;
        let params = new URLSearchParams({
          owner: this.owner,
          sortBy: this.sortBy,
          contractId: this.contractId,
          offset: offset || this.offset,
          limit: limit || this.limit,
        });

        params.forEach((value, key) => {
          if (!value) {
            params.delete(key);
          }
        });

        params = params.toString();

        console.log("params", params);

        let url =
          this.$route.name === "TemplateInstances"
            ? this.serverUrl +
              `/ng-rt-smartContracts/contracts/${this.$route.params.id}/instances?version=${this.$route.query.version}`
            : this.serverUrl + "/ng-rt-smartContracts/contracts" + "?" + params;

        let response = await project.ajax.get(url);
        console.log("state --->", response);
        return response;
      } catch (error) {
        this.handleError(error) 
      }
      finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
h1 {
  margin: 40px 0 20px;
}

.searchInstance {
  margin: 0px 0 0 0;
  padding: 0 0 20px 0;
  border-radius: 5px;
  animation: slideDown 0.3s ease-in-out;
  .inputs {
    display: flex;
    flex-direction: column;
  }

  select {
    height: 44px;
    border: 1px solid rgb(175, 195, 206);
    background: white;
    padding: 0 10px;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    outline: none;
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
</style>
