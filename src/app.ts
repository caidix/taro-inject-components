import { Component, PropsWithChildren } from "react";


import "./app.scss";

// window.srt.setChan({chan_id: 'xxx'}) // 设置渠道，渠道信息将会被设置在props.chan对象中

// window.srt.setUser({user_id: 'xxx'}) // 设置用户信息，用户信息将会被设置在props.wx_user对象中

class App extends Component<PropsWithChildren> {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  // this.props.children 是将要会渲染的页面
  render() {
    return this.props.children;
  }
}

export default App;
