// component/Privacy/index.ts
let privacyHandler;
let privacyResolves = new Set();
let closeOtherPagePopUpHooks = new Set();

if (wx.onNeedPrivacyAuthorization) {
  wx.onNeedPrivacyAuthorization((resolve) => {
    if (typeof privacyHandler === "function") privacyHandler(resolve);
  });
}

const closeOtherPagePopUp = (closePopUp) => {
  closeOtherPagePopUpHooks.forEach((hook) => {
    if (closePopUp !== hook) hook();
  });
};

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    autoShow: {
      type: Boolean,
      value: true,
    },
    title: {
      type: String,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    needAuthorization: false,
    popShow: false,
    privacyContractName: "",
  },
  lifetimes: {
    attached() {
      const closePopUp = () => {
        this.disPopUp();
      };
      privacyHandler = (resolve) => {
        privacyResolves.add(resolve);
        this.popUp();
        // 额外逻辑：当前页面的隐私弹窗弹起的时候，关掉其他页面的隐私弹窗
        closeOtherPagePopUp(closePopUp);
      };

      this.closePopUp = closePopUp;
      closeOtherPagePopUpHooks.add(this.closePopUp);
      // 判断是否需要隐私授权
      const { autoShow } = this.data;
      wx.getPrivacySetting({
        success: ({ needAuthorization, privacyContractName }) => {
          console.log("success", needAuthorization, privacyContractName);
          this.setData({
            needAuthorization,
            privacyContractName,
            popShow: autoShow && needAuthorization,
          });
        },
        fail: () => {},
        complete: () => {},
      });
    },
    detached: function () {
      closeOtherPagePopUpHooks.delete(this.closePopUp);
    },
  },
  pageLifetimes: {
    show() {
      if (this.closePopUp) {
        privacyHandler = (resolve) => {
          privacyResolves.add(resolve);
          this.popUp();
          closeOtherPagePopUp(this.closePopUp);
        };
      }
    },
  },
  methods: {
    handleAgree() {
      this.disPopUp();
      privacyResolves.forEach((resolve) => {
        resolve({
          event: "agree",
          buttonId: "agree-btn",
        });
      });
      privacyResolves.clear();
    },
    handleDisagree() {
      this.disPopUp();
      privacyResolves.forEach((resolve) => {
        resolve({
          event: "disagree",
        });
      });
      privacyResolves.clear();
    },
    popUp() {
      this.setData({
        popShow: true,
      });
    },
    disPopUp() {
      this.setData({
        popShow: false,
      });
    },
    // 打开隐私协议
    goPrivacy() {
      wx.openPrivacyContract({
        success: () => {}, // 打开成功
        fail: () => {}, // 打开失败
      });
    },
  },
});
