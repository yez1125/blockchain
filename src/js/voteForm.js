document.addEventListener("DOMContentLoaded", function () {
  const addOptionBtn = document.getElementById("addOption");
  const optionsContainer = document.getElementById("options-container");
  let optionCount = 1;

  function createNewOption() {
    optionCount++;
    const optionDiv = document.createElement("div");
    optionDiv.className = "option-group";

    optionDiv.innerHTML = `
            <div class="option-header" style="margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.1rem; color: var(--primary);">選項 ${optionCount}</h3>
                <button type="button" class="delete-option">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="form-group full-width">
                <div class="input-group">
                    <label>選項名稱</label>
                    <input type="text" class="option-name" placeholder="請輸入選項名稱">
                </div>
            </div>
            <div class="form-group full-width">
                <div class="input-group">
                    <label>選項說明</label>
                    <textarea class="option-description" placeholder="請輸入選項說明" rows="3"></textarea>
                </div>
            </div>
        `;

    optionsContainer.appendChild(optionDiv);
    addOptionEventListeners(optionDiv);
    lucide.createIcons();
  }

  function addOptionEventListeners(optionDiv) {
    const fileInput = optionDiv.querySelector(".option-image");
    const imagePreview = optionDiv.querySelector(".image-preview");
    const fileCustom = optionDiv.querySelector(".file-custom");

    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.innerHTML = `
                        <img src="${e.target.result}" alt="預覽圖片" style="max-width: 100%; max-height: 200px; margin-top: 10px;">
                    `;
          fileCustom.textContent = file.name;
        };
        reader.readAsDataURL(file);
      }
    });

    const deleteBtn = optionDiv.querySelector(".delete-option");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        // 確保不是第一個選項才能刪除
        const options = document.querySelectorAll(".option-group");
        if (options.length > 1) {
          optionDiv.remove();
          updateOptionNumbers();
        }
      });
    }
  }

  function updateOptionNumbers() {
    const options = document.querySelectorAll(".option-group");
    options.forEach((option, index) => {
      const header = option.querySelector("h3");
      if (header) {
        header.textContent = `選項 ${index + 1}`;
      }
    });
    optionCount = options.length;
  }

  function initializeFirstOption() {
    const firstOption = document.querySelector(".option-group");
    if (firstOption) {
      firstOption.insertAdjacentHTML(
        "afterbegin",
        `
                <div class="option-header">
                    <h3>選項 1</h3>
                </div>
            `
      );
      // 移除第一個選項的删除按鈕
      const deleteBtn = firstOption.querySelector(".delete-option");
      if (deleteBtn) {
        deleteBtn.remove();
      }
    }
  }

  // 初始化事件監聽
  if (addOptionBtn) {
    addOptionBtn.addEventListener("click", createNewOption);
  }

  // 初始化第一個選項
  const firstOption = document.querySelector(".option-group");
  if (firstOption) {
    addOptionEventListeners(firstOption);
  }
  initializeFirstOption();
});
