import {createStore} from 'solid-js/store';
import { RawServer } from '../RawData';
import { deleteServer } from '../services/ServerService';
import useAccount from './useAccount';
import useChannels from './useChannels';

export type Server = RawServer & {
  hasNotifications: boolean;
  update: (this: Server, update: Partial<RawServer>) => void;
  leave: () => Promise<RawServer>;
}
const [servers, setServers] = createStore<Record<string, Server | undefined>>({});





const set = (server: RawServer) => 
  setServers({
    ...servers,
    [server.id]: {
      ...server,
      get hasNotifications() {
        const channels = useChannels();
        return channels.getChannelsByServerId(server.id).some(channel => channel!.hasNotifications)
      },
      update(update) {
        setServers(this.id, update);
      },
      async leave() {
        return deleteServer(server.id);
      }
    }
  });

const remove = (serverId: string) => {  
  setServers(serverId, undefined);
}


const get = (serverId: string) => servers[serverId]

const array = () => Object.values(servers) as Server[];

const orderedArray = () => {
  const account = useAccount();
  const serverIdsArray = account.user()?.orderedServerIds;
  const order: Record<string, number> = {};
  serverIdsArray?.forEach((a, i) => {order[a] = i})
  
  return array()
    .sort((a, b) => a.createdAt - b.createdAt)
    .sort((a, b) => {
      const orderA = order[a.id];
      const orderB = order[b.id];
      if (orderA === undefined) {
        return -1;
      }
      if (orderB === undefined) {
        return 1;
      }
      return orderA - orderB;
    })
}


const hasNotifications =  () => {
  return array().find(s => s?.hasNotifications);
}

export default function useServers() {
  return {
    array,
    get,
    set,
    hasNotifications,
    orderedArray,
    remove
  }
}