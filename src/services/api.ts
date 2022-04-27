import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { SignOut } from "../context/AuthContext";

let cookies = parseCookies()
let isRefreshing = false
let failedRequestsQueue: { 
    onSuccess: (token: string) => void; 
    onFailure: (err: AxiosError) => void; 
}[] = []

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Bearer ${cookies['nextAuth.token']}`
    }
})

api.interceptors.response.use(response => {
    return response
}, (error) => {
    if(error.response?.status === 401) {
        if(error.response.data?.code === 'token.expired') {
            // refresh token
            cookies = parseCookies()

            const {'nextAuth.refreshToken': refreshToken} = cookies
            const originalConfig = error.config

            if(!isRefreshing) {
                isRefreshing = true
                
                api.post('/refresh', {refreshToken}).then(response => {
                    const {token} = response.data

                    setCookie(undefined, 'nextAuth.token', token, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/'
                    })

                    setCookie(undefined, 'nextAuth.refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/'
                    })

                    api.defaults.headers.common.Authorization = `Bearer ${token}`

                    failedRequestsQueue.forEach(request => request.onSuccess(token))
                    failedRequestsQueue = []
                })
                .catch(err => {
                    failedRequestsQueue.forEach(request => request.onFailure(err))
                    failedRequestsQueue = []
                })
                .finally(() => {
                    isRefreshing = false
                })
            }

            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        originalConfig.headers.common.Authorization = `Bearer ${token}`

                        resolve(api(originalConfig))
                    },
                    onFailure: (err: AxiosError) => {
                        reject(err)
                    } 
                })
            })
        } else {
            // logout
            SignOut()
        }
    }

    return Promise.reject(error)
})