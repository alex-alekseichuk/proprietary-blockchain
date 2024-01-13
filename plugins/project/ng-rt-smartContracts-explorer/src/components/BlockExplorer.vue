<template>
  <div class="content">
    <div class="blockItem" v-for="item in blocks" :key="item.id">
      <span class="name">{{ item.age }}</span>
      <span class="hash">{{ item.name }}</span>
    </div>

    <div class="blockFull">
      <div class="head">
        <span class="headName">block</span>
        <span class="headId">bae41af85f5dd56a093a36b333a1f35a63a405bc</span>
      </div>
      <div class="subhead">
        <span class="searchBlock"
          >search
          <!-- <v-icon>search</v-icon> -->
        </span>
      </div>
      <div class="content">
        <div class="details">
          <div
            class="row"
            v-for="(value, propertyName) in details"
            :key="propertyName"
          >
            <span class="left">{{ propertyName }}</span>
            <span class="right">{{ value }}</span>
          </div>
        </div>
        <div
          class="row"
          v-for="(value, propertyName) in more"
          :key="propertyName"
        >
          <span class="left">{{ propertyName }}</span>
          <span class="right">{{ value }}</span>
        </div>
      </div>
      <div class="bottom">
        <div class="tabs">
          <div class="tab active">Transaction</div>
          <div class="tab">Details</div>
        </div>
        <div class="bottomInfo">
          <div class="hashItem">
            8e14c15eb357ca7beca7453abc73634187484300c58c10b002b24e5180757461
          </div>
          <div class="hashItem">
            8e14c15eb357ca7beca7453abc73634187484300c58c10b002b24e5180757461
          </div>
        </div>
      </div>
    </div>

    <div class="blockItem" v-for="item in blocks" :key="item.id">
      <span class="name">{{ item.age }}</span>
      <span class="hash">{{ item.name }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TableList',
  data: function() {
    return {
      blocks: [
        {
          id: 1,
          name:
            'e7b1e5c7d5bfe10b929adc8528da5f49280850aec74b550cea6498ca0672b544',
          age: 23
        },
        {
          id: 2,
          name:
            'e7b1e5c7d5bfe10b929adc8528da5f49280850aec74b550cea6498ca0672b544',
          age: 21
        },
        {
          id: 3,
          name:
            'e7b1e5c7d5bfe10b929adc8528da5f49280850aec74b550cea6498ca0672b544',
          age: 22
        }
      ],
      details: {
        ChainId: 'test-chain-Abq25F ',
        Height: 'low: 2, high: 0, unsigned: false',
        Time:
          'low:	01532602117, lowUTC: 26 Jul 2018 12:48:37, high: 0,  unsigned: false'
      },
      more: {
        TotalTxs: '12',
        NumTxs: 'low: 1, high: 0, unsigned: false',
        LastBlockHash: '77634ba9727488150a986fac67ffc823fa08cf16',
        ValidatorHash: 'a4236aacd862d582e217e1b7300a22d3ac7077a5',
        AppHash:
          'e7b1e5c7d5bfe10b929adc8528da5f49280850aec74b550cea6498ca0672b544'
      },
      current: {
        name: '',
        age: ''
      }
    }
  },
  methods: {
    addPerson: function() {
      if (!this.current.name || !this.current.age) return
      this.people = [...this.people, this.current]
      this.current = { name: '', age: '' }
    }
  }
}
</script>

<style scoped lang="scss">
.content {
  padding: 0 0 20px 0;
}

.input {
  margin: 0 10px 0 0;
}

.blockItem {
  height: 50px;
  display: flex;
  flex-direction: row;
  background: rgb(253, 253, 253);
  align-items: center;
  padding: 0 20px;
  border-radius: 5px;
  margin: 0 0 1px 0;
  overflow: hidden;
  .name {
    flex: 0;
    min-width: 210px;
  }
  .hash {
    flex: 1;
  }
}

.blockFull {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 0 0px;
  border-radius: 5px;
  margin: 20px 0 20px 0;
  box-shadow: 0 1px 10px 2px rgba(0, 0, 20, 0.1);
  overflow: hidden;
  & > div {
    padding: 0 20px;
  }
  .head {
    line-height: 50px;
    height: 50px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-weight: 500;
    font-size: 1.2rem;
    display: flex;
    flex-direction: row;
    .headName {
      min-width: 210px;
    }

    .headId {
      flex: 1;
    }
  }

  .subhead {
    /* line-height: 40px;
    height: 40px; */
    box-sizing: border-box;
    margin: 0 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    padding: 10px 0;
    flex-direction: row;

    .searchBlock {
      width: 300px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      min-height: 40px;
      height: 40px;
      line-height: 40px;
      border-radius: 20px;
      padding: 0 20px;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    margin: 10px 10px 0 10px;
    .details {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      margin: 0 0 20px 0;
    }

    .row {
      display: flex;
      flex-direction: row;
      line-height: 40px;
      height: 40px;
      margin: 0 0 10px 0;
      .left {
        min-width: 200px;
        flex: 0;
        overflow: hidden;
        color: rgb(133, 133, 133);
        text-transform: capitalize;
      }
      .right {
        overflow: hidden;
        flex: 1;
      }
    }
  }

  .bottom {
    padding: 0;
    .tabs {
      padding: 0 20px;
      display: flex;
      flex-direction: row;
      font-weight: 500;
      border-bottom: 1px solid rgb(230, 230, 230);
      .tab {
        cursor: pointer;
        line-height: 50px;
        height: 50px;
        padding: 0 20px;
        margin: 0 0 -1px 0;
        &.active {
          border-bottom: 1px solid rgb(98, 141, 221);
        }
      }
    }
    .bottomInfo {
      background-color: rgba(0, 0, 0, 0.02);
      padding: 0 0 20px 0;
      .hashItem {
        line-height: 50px;
        height: 50px;
        padding: 0 20px;
        overflow: hidden;
        border-bottom: 1px solid rgb(230, 230, 230);
        &:last-child {
          border: none;
        }
      }
    }
  }
}
</style>
