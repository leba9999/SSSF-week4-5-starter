import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';
import userModel from '../models/userModel';

export default {
    Query: {
        cats: async () => {
            const cats = await catModel.find().populate('owner');
            return cats;
        },
        catById: async (parent: any, args: { id: string }) => {
            const cat = await catModel.findById(args.id).populate('owner');
            if (!cat) {
                throw new GraphQLError('Cat not found');
            }
            return cat;
        },
        catsByArea: async (parent: any, args: locationInput ) => {
            const bounds = rectangleBounds(args.topRight, args.bottomLeft);
            const cats = await catModel.find({
                location: {
                    $geoWithin: {
                        $geometry: bounds,
                    },
                },
            }).populate('owner');
            return cats;
        },
        catsByOwner: async (parent: any, args: { id: string }) => {
            return await catModel.find({owner: args.id}).populate('owner');
        },
    },
    Mutation: {
        createCat: async (parent: any, args: Cat, user: UserIdWithToken) => {
            try{
                if(!user.token) {
                    throw new GraphQLError('Not authorized',{
                        extensions: {code: 'NOT_AUTHORIZED'},
                    });
                }
                args.owner = user.id as unknown as Types.ObjectId;
                const cat = new catModel(args);
                const test = new userModel();
                const savedCat = await cat.save();
                return await savedCat.populate('owner');
            } catch (e) {
                console.log(e);
            }
        },
        updateCat: async (parent: any, args: Cat, user: UserIdWithToken) => {
            const cat = await catModel.findById(args.id).populate('owner');
            if(!cat){
                return;
            }
            console.log("modify ROLE:", user.role );
            if(!user.token || cat.owner._id.toString() !== user.id) {
                console.log("modify: 3", cat.owner);
                console.log("modify: 33", user);
                throw new GraphQLError('Not authorized',{
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }
            return await catModel.findByIdAndUpdate(args.id, args, {new: true});
        },
        deleteCat: async (parent: any, args: Cat, user: UserIdWithToken) => {
            const cat = await catModel.findById(args.id).populate('owner');
            if(!cat){
                return;
            }
            if(!user.token || (cat.owner._id.toString()  !== user.id && user.role !== 'admin')) {
                throw new GraphQLError('Not authorized',{
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }
            return await catModel.findByIdAndDelete(args.id).populate('owner');
        },
        updateCatAsAdmin: async (parent: any, args: Cat, user: UserIdWithToken) => {
            if(!user.token || user.role !== 'admin') {
                throw new GraphQLError('Not authorized',{
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }
            return await catModel.findByIdAndUpdate(args.id, args, {new: true});
        },
        deleteCatAsAdmin: async (parent: any, args: Cat, user: UserIdWithToken) => {
            if(!user.token || user.role !== 'admin') {
                throw new GraphQLError('Not authorized',{
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }
            return await catModel.findByIdAndDelete(args.id).populate('owner');
        },
    },
};