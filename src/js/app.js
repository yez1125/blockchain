// app.js
const Web3 = require("web3");
const contract = require("@truffle/contract");
const votingArtifacts = require("../../build/contracts/Voting.json");
const VotingContract = contract(votingArtifacts);
const { VoteAPI } = require("./vote-handlers.js");

window.App = {
  loading: false,
  contracts: {},
  account: null,

  load: async function () {
    await this.loadWeb3();
    await this.loadAccount();
    await this.loadContract();
    await this.render();
  },

  loadWeb3: async function () {
    if (typeof window.ethereum !== "undefined") {
      try {
        // 請求用戶授權
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // 設定 Web3 provider
        window.web3 = new Web3(window.ethereum);
      } catch (error) {
        console.error("用戶拒絕了訪問請求");
        throw new Error("請允許連接 MetaMask 以使用本應用");
      }
    } else {
      throw new Error("請安裝 MetaMask!");
    }
  },

  loadAccount: async function () {
    const accounts = await window.web3.eth.getAccounts();
    App.account = accounts[0];
    document.getElementById(
      "accountAddress"
    ).textContent = `當前帳戶: ${App.account}`;
  },

  loadContract: async function () {
    VotingContract.setProvider(window.ethereum);
    try {
      App.contracts.voting = await VotingContract.deployed();
    } catch (error) {
      console.error("無法載入合約:", error);
      throw new Error("無法載入投票合約");
    }
  },

  render: async function () {
    if (App.loading) return;
    App.loading = true;

    await this.renderContent();

    App.loading = false;
  },

  renderContent: async function () {
    const isVotingPage = window.location.pathname.includes("index.html");
    const isAdminPage = window.location.pathname.includes("admin.html");

    if (isVotingPage) {
      await this.renderVotingPage();
      console.log(1);
    } else if (isAdminPage) {
      await this.renderAdminPage();
    }
  },

  renderVotingPage: async function () {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const voteId = urlParams.get("id");
      console.log(2);

      if (!voteId) {
        throw new Error("無效的投票 ID");
      }

      // 檢查投票狀態
      const status = await VoteAPI.getVoteStatus(voteId);
      if (!status.isActive) {
        App.showMessage("投票已結束", "info");
        // 顯示結果
        const results = await VoteAPI.getVoteResults(voteId);
        // TODO: 實作結果顯示邏輯
        return;
      }

      const voteData = await VoteAPI.getVote(voteId);

      document.getElementById("voteTitle").textContent = voteData.title;
      document.getElementById("voteDescription").textContent =
        voteData.description;

      // 檢查 MetaMask 連接
      if (!window.ethereum || !window.ethereum.selectedAddress) {
        throw new Error("請先連接 MetaMask 錢包");
      }
    } catch (error) {
      console.error("載入投票頁面失敗:", error);
      App.showMessage(error.message, "error");
    }
  },

  renderAdminPage: async function () {
    try {
      // 檢查是否為管理員
      const isAdmin = await App.contracts.voting.isAdmin(App.account);
      if (!isAdmin) {
        throw new Error("您沒有管理員權限");
      }

      // 設置提交投票表單的處理
      document
        .getElementById("submitVote")
        .addEventListener("click", async (e) => {
          e.preventDefault();
          await App.handleCreateVote();
        });
    } catch (error) {
      console.error("載入管理頁面失敗:", error);
      App.showMessage(error.message, "error");
    }
  },

  handleCreateVote: async function () {
    try {
      const formData = window.voteForm.getFormData();

      // 先創建投票到後端
      const apiResult = await VoteAPI.createVote(formData);

      if (!apiResult.success) {
        throw new Error("創建投票失敗");
      }

      // 然後在區塊鏈上註冊投票
      await App.contracts.voting.createVote(
        apiResult.vote_id,
        formData.startDate,
        formData.endDate,
        { from: App.account }
      );

      App.showMessage("投票創建成功！", "success");
      setTimeout(() => {
        window.location.href = `/index.html?id=${apiResult.vote_id}`;
      }, 1500);
    } catch (error) {
      console.error("創建投票失敗:", error);
      App.showMessage(error.message, "error");
    }
  },

  handleVote: async function () {
    try {
      const selectedOption = document.querySelector(
        'input[name="voteOption"]:checked'
      );
      if (!selectedOption) {
        throw new Error("請選擇一個選項");
      }

      const urlParams = new URLSearchParams(window.location.search);
      const voteId = urlParams.get("id");
      const optionId = selectedOption.value;

      // 在區塊鏈上投票
      await App.contracts.voting.vote(voteId, optionId, { from: App.account });

      // 同步到後端
      await VoteAPI.submitVote(voteId, optionId);

      App.showMessage("投票成功！", "success");
      document.getElementById("voteButton").disabled = true;
    } catch (error) {
      console.error("投票失敗:", error);
      App.showMessage(error.message, "error");
    }
  },

  showMessage: function (message, type = "success") {
    const msgElement = document.getElementById("message");
    if (msgElement) {
      const icon = type === "success" ? "check-circle" : "alert-circle";
      msgElement.innerHTML = `
                <i data-lucide="${icon}"></i>
                ${message}
            `;
      msgElement.className = `message ${type}`;
      lucide.createIcons();

      setTimeout(() => {
        msgElement.className = "message";
        msgElement.innerHTML = "";
      }, 3000);
    }
  },
};

window.addEventListener("load", async () => {
  try {
    await App.load();
  } catch (error) {
    console.error("應用載入失敗:", error);
    App.showMessage(error.message, "error");
  }
});
