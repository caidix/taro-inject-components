import React, { Component, PropsWithChildren } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { merge } from "lodash-es";
// import merge from "lodash/merge";
import "./index.scss";

export default class Index extends Component<PropsWithChildren<any>> {
  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  onClick() {
    Taro.navigateTo({ url: "/pages/demo/index" });
    const i = merge({ a: 2, b: 3 });
    console.log(i);
  }

  render() {
    return (
      <View
        onClick={this.onClick.bind(this)}
        style={{ height: "500px", width: "100%", background: "#000" }}
      >
        <Text>Hello world!</Text>
      </View>
    );
  }
}
