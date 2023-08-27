import _axios from "axios";
import useUserStore from "../store/user";
import { auth, checkFirebaseAuth } from "./firebase";

const axios = _axios.create({
  baseURL: 'http://localhost:9000/v2',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    // 'Authorization': `Bearer ${idToken}`,
  },
  responseType: 'json',
});

axios.interceptors.request.use(async (request) => {
  //リクエスト前に毎回idTokenを取得する
  const idToken = useUserStore.getState().idToken;
  const user = await checkFirebaseAuth(auth);

  if (!user) return request;
  
  request.headers.Authorization = idToken;
  
  return request
},(error) => {
  // リクエスト エラーの処理
  return Promise.reject(error);
});

export default axios;