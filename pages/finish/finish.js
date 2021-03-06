var app = getApp();
var util = require('../../utils/util.js')
var Api = require('../../utils/api.js')

Page({
  data: {
    token: '',
    stringTime: '00:00',
    durationTime: '',

    numberTime: 0,
    playing: false,
    percent: 0,
    btnText: '分享',

    hasEmptyInput: false,
    emptyInputInfo: '',
    titleFocus: false,
    descriptionFocus: false,
    title: '',
    description: ''
  },

  //设置一些必要的信息
  onLoad: function() {
    var info = wx.getStorageSync('info');
    //为了兼容 模拟器环境 和 真机环境
    //在真机info为string
    typeof info === 'object' ? '' : info = JSON.parse(info);
    console.log(info)
    this.setData({
      token: info.token,
      stringTime: app.globalData.stringTime,
      durationTime: app.globalData.durationTime
    })
  },

  bindInputOnChange(e) {
    this.setData({title: e.detail.value})
  },

  bindTextareaOnChange(e) {
    this.setData({description: e.detail.value})
  },

  
  //表单提交事件处理
  bindSubmitBTN: function(e) {
  
     //表单验证
     console.log('开始表单验证')
     this.inputCheck({
        title: this.data.title,
        description: this.data.description,
        success: () => {
          //表单验证通过
          this.setData({ hasEmptyInput: false })
          console.log('验证通过')
          console.log('开始第一次上传')
          this.uploadInit()
          
        },
        fail: (res) => {
          //表单验证失败
          if(res.errorType === 'title') {
            this.setData({titleFocus: true})
          }
          if(res.errorType === 'description'){
            this.setData({descriptionFocus: true})
          }
          this.setData({hasEmptyInput: true, emptyInputInfo: res.errorInfo})
        }
     })
  },

  //验证表单函数
  inputCheck: function(obj) {
    if(obj.title == '')
      obj.fail({errorType: 'title', errorInfo: '标题不能为空'})
    else if(obj.description == '')
      obj.fail({errorType: 'description', errorInfo: '描述不能为空'})
    else
      obj.success()
  },

  //发生上传错误时的函数
  uploadErrorHandle: function(title, content) {
    wx.showModal({
      title: title,
      content: content,
      confirmText: '回到首页',
      showCancel: false,
      success: function(res) {
        if(res.confirm) {
          wx.switchTab({url: '/pages/index/index'})
        }
      }
    })
  },

  //第一次上传，上传语音文件
  uploadInit: function() {
    console.log('进入第一次上传内部')
    var apiUrl = Api.upload + '?token=' + this.data.token 
    this.setData({loading: true, btnText: '上传中'})
    var _this = this
    wx.uploadFile({
      url: apiUrl,
      filePath: app.globalData.tempfillPath,
      name:'imagination',
      success: (res) => {
        console.log('第一次上传成功成功，开始进行第二次上传')
        console.log(res)
        _this.uploadAgain(res.data)
      },
      fail: (res) => {
        console.error('上传语音文件发生错误：', res)
        //这里需要添加处理函数
        _this.uploadErrorHandle('上传失败','服务器发生未知错误')
      }
    })
  },

  //第二次上传，上传表单信息
  uploadAgain: function(responseData) {
    console.log('进入第二次上传')
    var _this = this;
    wx.request({
      url: Api.host + '/imagination?token=' + _this.data.token,
      data: {
        title: _this.data.title,
        description: _this.data.description,
        src: responseData,
        duration: app.globalData.durationTime
      },
      method: 'POST', 
      success: (res) => {   
        console.log('第二次上传成功')
        console.log('成功返回数据：',res)
        _this.setData({btnText: '上传成功', loading: false})
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 1000
        })
        setTimeout(function(){
          wx.switchTab({url: '/pages/index/index'})
        },1000)
      },
      fail: (res) => {
        console.error('上传表单信息时发生错误：', res)
        _this.uploadErrorHandle('上传失败','服务器发生未知错误')
      }
    })
  },

  //播放进度函数
  showPercent: function() {
    var _this = this
    if(this.data.percent > 100) return
    _this.setData({percent: _this.data.percent + 100/(_this.data.durationTime/500)})
    if(_this.data.playing) {
      setTimeout(function(){
        _this.showPercent()  
      }, 500)
    }
  },

  //时间进度函数
  showTime: function() {
    var _this = this
    if(this.data.numberTime * 1000 > this.data.durationTime) return
    _this.setData({numberTime: _this.data.numberTime + 1})
    _this.setData({stringTime: util.NumberToTime(this.data.numberTime)})
    if(_this.data.playing) {
      setTimeout(function(){
        _this.showTime()
      }, 1000)
    }
  },

  //语音播放事件处理
  playVoiceCatchTap: function(){
    var _this = this
    if(this.data.playing) {
      this.setData({
        playing: false,
        percent: 0,
        numberTime: 0
      })
      wx.stopVoice()
    }
    else {
      this.setData({
        playing: true,
        percent: 0,
        numberTime: 0
      })

      _this.showPercent()
      _this.showTime()

      wx.playVoice({
        filePath: app.globalData.tempfillPath,
        complete: function(res){
          _this.setData({
            playing: false,
            percent: 100
          })
        }
      })
    }
  }


    
})

//因为textarea只能在失去焦点的时候监听其数据，所以 。。。。