import { searchDestinations } from '../../utils/shipping'

export default defineEventHandler(async (event): Promise<unknown[]> => searchDestinations(getQuery(event).search?.toString() || ''))
