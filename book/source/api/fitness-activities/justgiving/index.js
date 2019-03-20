import { required } from '../../../utils/params'

export const deserializeFitnessActivity = (activity = required()) =>
  Promise.reject(new Error('This method is not supported by JustGiving'))

export const fetchFitnessActivities = (params = required()) =>
  Promise.reject(new Error('This method is not supported by JustGiving'))

export const createFitnessActivity = (params = required()) =>
  Promise.reject(new Error('This method is not supported by JustGiving'))

export const updateFitnessActivity = (id = required(), params = required()) =>
  Promise.reject(new Error('This method is not supported by JustGiving'))

export const deleteFitnessActivity = (id = required(), token = required()) =>
  Promise.reject(new Error('This method is not supported by JustGiving'))