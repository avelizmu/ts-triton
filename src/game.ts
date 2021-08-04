import {TritonClient} from "./client";

type Action = 'Do Nothing' | 'Collect All' | 'Drop All' | 'Collect' | 'Drop' | 'Collect All But' | 'Drop All But' | 'Garrison Star'

export type UniverseData = {
    fleet_speed: number,
    paused: boolean,
    productions: number,
    tick_fragment: number,
    now: number,
    tick_rate: number,
    production_rate: number,
    stars_for_victory: number,
    game_over: number,
    started: boolean,
    start_time: number,
    total_stars: number,
    production_counter: number,
    trade_scanned: number,
    tick: number,
    trade_cost: number,
    name: string,
    player_uid: number,
    admin: number,
    turn_based: number,
    war: number,
    turn_based_time_out: number,

    fleets: {
        [key: string]: {
            l: number,
            lx: string,
            ly: string,
            n: string,
            o: any,
            puid: number,
            st: number,
            uid: number,
            w: number,
            x: string,
            y: string
        }
    },
    players: {
        [key: string]: {
            ai: number,
            alias: string,
            avatar: number,
            conceded: number,
            huid: number,
            karma_to_give: number,
            missed_turns: number,
            ready: number,
            regard: number,
            tech: {
                [key in 'banking' | 'manufacturing' | 'propulsion' | 'research' | 'scanning' | 'terraforming' | 'weapons']: {
                    value: number,
                    level: number
                }
            },
            total_economy: number,
            total_fleets: number,
            total_industry: number,
            total_science: number,
            total_stars: number,
            total_strength: number
        }
    },
    stars: {
        [key: string]: {
            n: string,
            puid: number,
            uid: number,
            v: string,
            x: string,
            y: string
        }
    },
}


type ShipOrder = {
    delay: number,
    targetPlanetId: number,
    action: Action,
    ships: number
}

export class TritonGame {
    client: TritonClient;
    id: string;
    currentUniverse: UniverseData;

    constructor(client: TritonClient, gameId: string) {
        this.client = client;
        this.id = gameId;
    }

    order(type: string, order: string) {
        return this.client.gameRequest(type, this.id, {
            order
        })
    }

    async getFullUniverse() {
        this.currentUniverse = await this.order('order', 'full_universe_report')
        return this.currentUniverse;
    }

    getIntel() {
        return this.client.gameRequest('intel_data', this.id);
    }

    getUnreadCount() {
        return this.client.gameRequest('fetch_unread_count', this.id);
    }

    getPlayerAchievements() {
        return this.client.gameRequest('fetch_player_achievements', this.id);
    }

    getMessages(messageType: 'game_diplomacy' | 'game_event', count: number, offset: number = 0) {
        const options = {
            count,
            offset,
            group: messageType
        }
        return this.client.gameRequest('fetch_game_messages', this.id, options);
    }

    getDiplomacyMessages(count: number, offset: number = 0) {
        return this.getMessages('game_diplomacy', count, offset);
    }

    getEventMessages(count: number, offset: number = 0) {
        return this.getMessages('game_event', count, offset);
    }

    buyEconomy(star: string, price: number) {
        return this.order('batched_orders', `upgrade_economy,${star},${price}`);
    }

    buyIndustry(star: string, price: number) {
        return this.order('batched_orders', `upgrade_industry,${star},${price}`);
    }

    buyScience(star: string, price: number) {
        return this.order('batched_orders', `upgrade_science,${star},${price}`);
    }

    giveShipOrder(shipId: number, orders: ShipOrder[]) {
        return this.order('order', `add_fleet_orders,${shipId},${this.encodeShipOrders(orders)},0`)
    }
    
    encodeShipOrders(orders: ShipOrder[]) {
        let encoded = '';

        // Encode the delays
        encoded = orders.reduce((previous, current) => {
            return previous + current.delay + '_'
        }, '').slice(0, -1) + ',';

        // Encode the target planets
        encoded = encoded + orders.reduce((previous, current) => {
            return previous + current.targetPlanetId + '_'
        }, '').slice(0, -1) + ',';

        // Encode the actions
        encoded = encoded + orders.reduce((previous, current) => {
            return previous + this.encodeAction(current.action) + '_'
        }, '').slice(0, -1) + ',';

        // Encode the ship amounts
        encoded = encoded + orders.reduce((previous, current) => {
            return previous + current.ships + '_'
        }, '').slice(0, -1);

        return encoded;
    }

    encodeAction(action: Action) {
        switch(action) {
            case 'Do Nothing': return 0;
            case 'Collect All': return 1;
            case 'Drop All': return 2;
            case 'Collect': return 3;
            case 'Drop': return 4;
            case 'Collect All But': return 5;
            case 'Drop All But': return 6;
            case 'Garrison Star': return 7;
        }
    }
}