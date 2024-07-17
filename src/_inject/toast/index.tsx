import Taro from "@tarojs/taro";
import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "@tarojs/components";

interface IShowToastProps extends Taro.showToast.Option {
  custom?: boolean;
  close?: () => void;
}

interface IHideToastProps extends Taro.hideToast.Option {
  custom?: boolean;
}

const callbackResult = { errMsg: "" };
const env = (Taro.getEnv() || "").toLocaleLowerCase();

/**
 * 吐司注入组件
 * @param {boolean} custom 当值为 true 时，展示为AtToast的吐司，用于兼容长提示语的场景。当你使用loading等时候应无需添加
 * @returns
 */
const FToast: React.FC = () => {
  const [data, setData] = useState({
    text: "",
    status: "success",
    duration: 2000,
    hasMask: false,
    isOpened: false,
  });
  const defaultShowToastRef = useRef<typeof Taro.showToast>();
  const defaultHideToastRef = useRef<typeof Taro.hideToast>();
  const completeRef = useRef<IShowToastProps["complete"]>(undefined);
  const successRef = useRef<IShowToastProps["success"]>(undefined);
  const failRef = useRef<IShowToastProps["fail"]>(undefined);
  const closeRef = useRef<IShowToastProps["close"]>(undefined);

  useEffect(() => {
    console.log("zhuru");
  }, []);

  return <View>哈哈哈哈</View>;
};

export default FToast;
