import React from "react";
import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";

const Demo = () => {
  const handleClick = () => {
    Taro.showToast({
      title: "测试",
      success: () => {
        Taro.navigateBack();
      },
    });
  };
  const handleClick2 = () => {
    Taro.showToast({
      title: "测试2",
      complete: () => {
        Taro.navigateBack();
      },
    });
  };
  return (
    <View>
      <View
        style={{ height: "500px", width: "100%", background: "#000" }}
        onClick={handleClick}
      >
        21321321
      </View>
      <View
        style={{ height: "500px", width: "100%", background: "blue" }}
        onClick={handleClick2}
      >
        4444
      </View>
    </View>
  );
};

export default Demo;
