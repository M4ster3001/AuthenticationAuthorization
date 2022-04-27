import Router from 'next/router'
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import {createContext, ReactNode, useContext, useEffect, useState} from 'react'
import { api } from '../services/api'

type User = {
    email: string
    permission: string[]
    roles: string[]
}

type SignInCredentials = {
    email: string
    password: string
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>
    isAuthenticated: boolean
    user: User
}

type AuthProviderProps = {
    children: ReactNode
}

export function SignOut() {
    destroyCookie(undefined, 'nextAuth.token')
    destroyCookie(undefined, 'nextAuth.refreshToken')

    Router.push('/')
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({children}: AuthProviderProps) {
    const [user, setUser] = useState<User>({} as User)
    const isAuthenticated = !!user

    useEffect(() => {
        const {'nextAuth.token': token} = parseCookies()

        if(token) {
            api.get('/me').then(response => {
                const { email, permission, roles } = response.data

                setUser({ email,permission,roles })
            }).catch(() => {
                SignOut()
            })
        }
    }, [])

    async function signIn({email, password}: SignInCredentials) {
        try {
            const response = await api.post('/sessions', {
                email, password
            })

            const {token, refreshToken, permission, roles} = response.data

            setCookie(undefined, 'nextAuth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })

            setCookie(undefined, 'nextAuth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })

            setUser({
                email,
                permission,
                roles
            })

            api.defaults.headers.common.Authorization = `Bearer ${token}`

            Router.push('/dashboard')
        }catch(err) {
            console.error(err)
        }
    }

    return (
        <AuthContext.Provider value={{signIn, isAuthenticated, user}}>
            {children}
        </AuthContext.Provider>
    )
}

export default function useAuth() {
    const context =  useContext(AuthContext)

    return context
}