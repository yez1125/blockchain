// vote-handlers.js
const API_CONFIG = {
  BASE_URL: "http://localhost:8000/api/v1", // 加入版本號
  ENDPOINTS: {
    VOTES: "/votes",
    OPTIONS: "/options/create", // 修改選項創建端點
    SUBMIT: "/votes/submit",
    STATUS: "/votes/status",
    RESULTS: "/votes/results",
  },
};

// 資料格式定義
const VoteDataStructure = {
  title: String, // 投票標題
  content: String, // 投票內容
  start_date: String, // 開始日期 "YYYY-MM-DD"
  end_date: String, // 結束日期 "YYYY-MM-DD"
  options: [
    {
      title: String, // 選項標題
      description: String, // 選項描述
      image: File, // 選項圖片
    },
  ],
};

class VoteAPI {
  static async getVoteStatus(voteId) {
    return await this.request(`${API_CONFIG.ENDPOINTS.STATUS}/${voteId}`);
  }

  static async getVoteResults(voteId) {
    return await this.request(`${API_CONFIG.ENDPOINTS.RESULTS}/${voteId}`);
  }

  // request方法修改
  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000//createVote?voter_id=${voter_id}&password=${password}`,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API錯誤:", error);
      throw error;
    }
  }

  static async createVote(voteData) {
    try {
      // 首先創建投票基本信息
      const voteResponse = await fetch("http://127.0.0.1:8000/createVote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: voteData.title,
          content: voteData.description,
          options: voteData.options,
          start_date: voteData.startDate,
          end_date: voteData.endDate,
        }),
      });

      return {
        success: true,
        vote_id: voteId,
      };
    } catch (error) {
      console.error("創建投票失敗:", error);
      throw error;
    }
  }

  static async getVote(voteId) {
    try {
      // 取得投票基本信息
      const voteData = await fetch(
        `http://127.0.0.1:8000/getVoteInfo/${voteId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // 取得投票選項
      const optionsData = await fetch(
        `http://127.0.0.1:8000/getVoteOption/${voteId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        ...voteData,
        options: optionsData.map((option) => ({
          id: option[0],
          title: option[2],
          description: option[3],
        })),
      };
    } catch (error) {
      console.error("獲取投票信息失敗:", error);
      throw error;
    }
  }

  static async submitVote(voteId, optionId) {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.SUBMIT, {
        method: "POST",
        body: JSON.stringify({
          vote_id: voteId,
          option_id: optionId,
        }),
      });

      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error("提交投票失敗:", error);
      throw error;
    }
  }

  static async retryRequest(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryRequest(fn, retries - 1, delay * 2);
    }
  }
}
module.exports = { VoteAPI };
