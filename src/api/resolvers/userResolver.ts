import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';

export default {
    Query: {
        users: async () => {
            const response = await fetch(`${process.env.AUTH_URL}/users`)
            if(!response.ok){
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const users = (await response.json());
            return users;
        },
        userById: async (_parent: unknown, args: { id: string }) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`)
            if(!response.ok){
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const user = (await response.json()) as User;
            return user;
        },
        checkToken: async (_parent: unknown, args: unknown, user: UserIdWithToken) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/${user.id}/check`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if(!response.ok){
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const userFromAuth = await response.json();
            return userFromAuth;
        },
    },
    Mutation: {
        login: async (_parent: unknown, args: { credentials:{username: string, password: string} }) => {
            const response = await fetch(`${process.env.AUTH_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(args.credentials),
            });
            if(!response.ok){
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const user = (await response.json());
            return user;
        },
        register: async (_parent: unknown, args: {user: User} ) => {
            try{
                const response = await fetch(`${process.env.AUTH_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(args.user),
                });
                if(!response.ok){
                    throw new GraphQLError(response.statusText, {
                        extensions: {code: 'NOT_FOUND'},
                    });
                }
                const user = (await response.json()) as LoginMessageResponse;
                return user;
            } catch(e){
                console.log(e);
            }
        },
        updateUser: async (_parent: unknown, args: {user : User}, user: UserIdWithToken) => {
            if(!user.token) {
                throw new GraphQLError('Not authorized',{
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }
            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify(args.user),
            });
            if(!response.ok){
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const userFromPut = (await response.json()) as LoginMessageResponse;
            return userFromPut;
        },
        deleteUser: async (_parent: unknown, args: unknown, user: UserIdWithToken) => {
            if(!user.token) {
                throw new GraphQLError('Not authorized',{
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }
            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if(!response.ok){
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const userFromDelete = (await response.json()) as LoginMessageResponse;
            return userFromDelete;
        },
        deleteUserAsAdmin: async (_parent: unknown, args: {id: string}, user: UserIdWithToken) => {
            if(!user.token) {
                throw new GraphQLError('Not authorized',{
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }
            const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if(!response.ok){
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const userFromDelete = (await response.json());
            return userFromDelete;
        },
    },
};