export const REST_SIM_WIDTH = 600;
export const REST_SIM_HEIGHT = 400;

export const RESTAURANT_INPUT_COUNT = 44;
export const RESTAURANT_MAX_STEPS = 18000; // 300s simulated shift at 60fps
export const RESTAURANT_MAX_WALKOUTS = 20;
export const RESTAURANT_DWELL_STEPS = 8;
export const RESTAURANT_WAIT_PENALTY_PER_CUSTOMER = -0.12;
export const RESTAURANT_LEAVE_PENALTY = -200;
export const RESTAURANT_ORDER_VECTOR_REWARD = 0.8;
export const RESTAURANT_ORDER_PAD_REWARD = 8;
export const RESTAURANT_STATION_VECTOR_REWARD = 0.6;
export const RESTAURANT_STATION_PAD_REWARD = 4;
export const RESTAURANT_ITEM_PICKUP_BONUS = 25;
export const RESTAURANT_TABLE_VECTOR_REWARD = 0.6;
export const RESTAURANT_TABLE_PAD_REWARD = 5;
export const RESTAURANT_DELIVER_ITEM_BONUS = 40;
export const RESTAURANT_SERVE_COMPLETE_BONUS = 80;

export const RESTAURANT_INPUT_LABELS: string[] = [
  'px',
  'py',
  'vx',
  'vy',
  'tray.B',
  'tray.F',
  'tray.D',
  'ord.q',
  'ord.urg',
  'ord.needB',
  'ord.needF',
  'ord.needD',
  'ord.dx',
  'ord.dy',
  'brg.dx',
  'brg.dy',
  'fry.dx',
  'fry.dy',
  'drk.dx',
  'drk.dy',
  't1.occ',
  't1.urg',
  't1.dx',
  't1.dy',
  't1.needB',
  't1.needF',
  't1.needD',
  't2.occ',
  't2.urg',
  't2.dx',
  't2.dy',
  't2.needB',
  't2.needF',
  't2.needD',
  't3.occ',
  't3.urg',
  't3.dx',
  't3.dy',
  't3.needB',
  't3.needF',
  't3.needD',
  'fill.B',
  'fill.F',
  'fill.D',
];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OrderItems {
  burger: boolean;
  fries: boolean;
  drink: boolean;
}

export type StationKind = 'order' | 'burger' | 'fry' | 'drink';

export interface StationDef {
  id: StationKind;
  label: string;
  shortLabel: string;
  color: string;
  counter: Rect;
  zone: Rect;
  zoneCx: number;
  zoneCy: number;
}

export interface TableDef {
  index: number;
  label: string;
  tableRect: Rect;
  zone: Rect;
  zoneCx: number;
  zoneCy: number;
  seatX: number;
  seatY: number;
}

export type CustomerState = 'queuing' | 'walkingToTable' | 'seatedWaiting' | 'eating';

export interface RestaurantCustomer {
  id: number;
  state: CustomerState;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  tableIndex: number | null;
  order: OrderItems;
  delivered: OrderItems;
  patience: number;
  maxPatience: number;
  eatTimer: number;
  queuePenaltyAccrued: number;
}

export interface RestaurantState {
  tray: OrderItems;
  customers: RestaurantCustomer[];
  nextCustomerId: number;
  spawnCooldown: number;
  customersServed: number;
  customersLeft: number;
  totalWaitTicks: number;
  zoneDwell: Record<string, number>;
  activeZoneId: string | null;
  lastEventText: string;
  lastEventTimer: number;
}

export const RESTAURANT_STATIONS: StationDef[] = [
  {
    id: 'burger',
    label: 'BURGER',
    shortLabel: 'B',
    color: '#f59e0b',
    counter: { x: 112, y: 14, w: 96, h: 32 },
    zone: { x: 112, y: 46, w: 96, h: 44 },
    zoneCx: 160,
    zoneCy: 68,
  },
  {
    id: 'fry',
    label: 'FRIES',
    shortLabel: 'F',
    color: '#eab308',
    counter: { x: 252, y: 14, w: 96, h: 32 },
    zone: { x: 252, y: 46, w: 96, h: 44 },
    zoneCx: 300,
    zoneCy: 68,
  },
  {
    id: 'drink',
    label: 'DRINK',
    shortLabel: 'D',
    color: '#38bdf8',
    counter: { x: 392, y: 14, w: 96, h: 32 },
    zone: { x: 392, y: 46, w: 96, h: 44 },
    zoneCx: 440,
    zoneCy: 68,
  },
  {
    id: 'order',
    label: 'ORDER',
    shortLabel: 'ORD',
    color: '#a78bfa',
    counter: { x: 74, y: 152, w: 38, h: 92 },
    zone: { x: 112, y: 152, w: 54, h: 92 },
    zoneCx: 139,
    zoneCy: 198,
  },
];

export const RESTAURANT_TABLES: TableDef[] = [
  {
    index: 0,
    label: 'T1',
    tableRect: { x: 276, y: 158, w: 58, h: 36 },
    zone: { x: 270, y: 194, w: 70, h: 44 },
    zoneCx: 305,
    zoneCy: 216,
    seatX: 305,
    seatY: 142,
  },
  {
    index: 1,
    label: 'T2',
    tableRect: { x: 458, y: 158, w: 58, h: 36 },
    zone: { x: 452, y: 194, w: 70, h: 44 },
    zoneCx: 487,
    zoneCy: 216,
    seatX: 487,
    seatY: 142,
  },
  {
    index: 2,
    label: 'T3',
    tableRect: { x: 367, y: 286, w: 58, h: 36 },
    zone: { x: 361, y: 322, w: 70, h: 44 },
    zoneCx: 396,
    zoneCy: 344,
    seatX: 396,
    seatY: 270,
  },
];

const QUEUE_SPOTS: { x: number; y: number }[] = [
  { x: 52, y: 198 },
  { x: 52, y: 232 },
  { x: 52, y: 266 },
  { x: 52, y: 300 },
];

const DOOR_POS = { x: 26, y: 378 };
const QUEUE_MAX_PATIENCE = 2200;
const TABLE_MAX_PATIENCE = 3000;
const EAT_DURATION_STEPS = 75;
const CUSTOMER_WALK_SPEED = 2.1;
const SPAWN_INTERVAL_STEPS = 250;
const MAX_ACTIVE_CUSTOMERS = 6;

const SOLID_OBSTACLES: Rect[] = [
  ...RESTAURANT_STATIONS.map((s) => s.counter),
  ...RESTAURANT_TABLES.map((t) => t.tableRect),
];

function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function rollRandomOrder(): OrderItems {
  const r = Math.random();
  let count = 1;
  if (r > 0.35 && r <= 0.78) count = 2;
  else if (r > 0.78) count = 3;

  const keys: (keyof OrderItems)[] = ['burger', 'fries', 'drink'];
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = keys[i];
    keys[i] = keys[j];
    keys[j] = tmp;
  }

  const order: OrderItems = { burger: false, fries: false, drink: false };
  for (let i = 0; i < count; i++) {
    order[keys[i]] = true;
  }
  return order;
}

function createCustomer(id: number, queueSlot: number, immediateAtSlot = false): RestaurantCustomer {
  const spot = QUEUE_SPOTS[Math.min(queueSlot, QUEUE_SPOTS.length - 1)];
  return {
    id,
    state: 'queuing',
    x: immediateAtSlot ? spot.x : DOOR_POS.x,
    y: immediateAtSlot ? spot.y : DOOR_POS.y,
    targetX: spot.x,
    targetY: spot.y,
    tableIndex: null,
    order: rollRandomOrder(),
    delivered: { burger: false, fries: false, drink: false },
    patience: QUEUE_MAX_PATIENCE,
    maxPatience: QUEUE_MAX_PATIENCE,
    eatTimer: 0,
    queuePenaltyAccrued: 0,
  };
}

export function createInitialRestaurantState(): RestaurantState {
  const firstCustomer = createCustomer(1, 0, true);
  return {
    tray: { burger: false, fries: false, drink: false },
    customers: [firstCustomer],
    nextCustomerId: 2,
    spawnCooldown: 170,
    customersServed: 0,
    customersLeft: 0,
    totalWaitTicks: 0,
    zoneDwell: {},
    activeZoneId: null,
    lastEventText: '',
    lastEventTimer: 0,
  };
}

export function cloneRestaurantState(state: RestaurantState): RestaurantState {
  return {
    tray: { ...state.tray },
    customers: state.customers.map((c) => ({
      ...c,
      order: { ...c.order },
      delivered: { ...c.delivered },
      queuePenaltyAccrued: c.queuePenaltyAccrued ?? 0,
    })),
    nextCustomerId: state.nextCustomerId,
    spawnCooldown: state.spawnCooldown,
    customersServed: state.customersServed,
    customersLeft: state.customersLeft,
    totalWaitTicks: state.totalWaitTicks,
    zoneDwell: { ...state.zoneDwell },
    activeZoneId: state.activeZoneId,
    lastEventText: state.lastEventText,
    lastEventTimer: state.lastEventTimer,
  };
}

export function resolvePlayerObstacles(player: { x: number; y: number }): void {
  const half = 6;
  player.x = Math.max(half, Math.min(REST_SIM_WIDTH - half, player.x));
  player.y = Math.max(half, Math.min(REST_SIM_HEIGHT - half, player.y));

  for (const rect of SOLID_OBSTACLES) {
    const minX = rect.x - half;
    const maxX = rect.x + rect.w + half;
    const minY = rect.y - half;
    const maxY = rect.y + rect.h + half;
    if (player.x > minX && player.x < maxX && player.y > minY && player.y < maxY) {
      const pushLeft = player.x - minX;
      const pushRight = maxX - player.x;
      const pushTop = player.y - minY;
      const pushBottom = maxY - player.y;
      const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);
      if (minPush === pushLeft) player.x = minX;
      else if (minPush === pushRight) player.x = maxX;
      else if (minPush === pushTop) player.y = minY;
      else player.y = maxY;
    }
  }
}

function getOccupiedTableFlags(customers: RestaurantCustomer[]): boolean[] {
  const flags = [false, false, false];
  for (const c of customers) {
    if (c.tableIndex !== null && c.tableIndex >= 0 && c.tableIndex < 3) {
      flags[c.tableIndex] = true;
    }
  }
  return flags;
}

function reassignQueueTargets(customers: RestaurantCustomer[]): void {
  let slot = 0;
  for (const c of customers) {
    if (c.state === 'queuing') {
      const spot = QUEUE_SPOTS[Math.min(slot, QUEUE_SPOTS.length - 1)];
      c.targetX = spot.x;
      c.targetY = spot.y;
      slot++;
    }
  }
}

export function getActiveOrderDemand(state: RestaurantState): OrderItems {
  const demand: OrderItems = { burger: false, fries: false, drink: false };
  for (const c of state.customers) {
    if (c.state === 'walkingToTable' || c.state === 'seatedWaiting') {
      if (c.order.burger && !c.delivered.burger) demand.burger = true;
      if (c.order.fries && !c.delivered.fries) demand.fries = true;
      if (c.order.drink && !c.delivered.drink) demand.drink = true;
    }
  }
  return demand;
}

export function getOrderToPickUp(state: RestaurantState): OrderItems {
  const demand = getActiveOrderDemand(state);
  return {
    burger: demand.burger && !state.tray.burger,
    fries: demand.fries && !state.tray.fries,
    drink: demand.drink && !state.tray.drink,
  };
}

export function buildRestaurantInputs(
  player: { x: number; y: number; vx: number; vy: number },
  playerSpeed: number,
  state: RestaurantState
): number[] {
  const inputs = new Array<number>(104).fill(0);
  inputs[0] = (player.x / REST_SIM_WIDTH) * 2 - 1;
  inputs[1] = (player.y / REST_SIM_HEIGHT) * 2 - 1;
  inputs[2] = player.vx / playerSpeed;
  inputs[3] = player.vy / playerSpeed;

  inputs[4] = state.tray.burger ? 1 : 0;
  inputs[5] = state.tray.fries ? 1 : 0;
  inputs[6] = state.tray.drink ? 1 : 0;

  const queuing = state.customers.filter((c) => c.state === 'queuing');
  const frontQueue = queuing[0] ?? null;
  const orderStation = RESTAURANT_STATIONS.find((s) => s.id === 'order')!;
  const burgerStation = RESTAURANT_STATIONS.find((s) => s.id === 'burger')!;
  const fryStation = RESTAURANT_STATIONS.find((s) => s.id === 'fry')!;
  const drinkStation = RESTAURANT_STATIONS.find((s) => s.id === 'drink')!;

  inputs[7] = Math.min(1, queuing.length / 3);
  inputs[8] = frontQueue ? Math.max(0, Math.min(1, 1 - frontQueue.patience / frontQueue.maxPatience)) : 0;
  inputs[9] = frontQueue?.order.burger ? 1 : 0;
  inputs[10] = frontQueue?.order.fries ? 1 : 0;
  inputs[11] = frontQueue?.order.drink ? 1 : 0;
  inputs[12] = (orderStation.zoneCx - player.x) / REST_SIM_WIDTH;
  inputs[13] = (orderStation.zoneCy - player.y) / REST_SIM_HEIGHT;

  inputs[14] = (burgerStation.zoneCx - player.x) / REST_SIM_WIDTH;
  inputs[15] = (burgerStation.zoneCy - player.y) / REST_SIM_HEIGHT;
  inputs[16] = (fryStation.zoneCx - player.x) / REST_SIM_WIDTH;
  inputs[17] = (fryStation.zoneCy - player.y) / REST_SIM_HEIGHT;
  inputs[18] = (drinkStation.zoneCx - player.x) / REST_SIM_WIDTH;
  inputs[19] = (drinkStation.zoneCy - player.y) / REST_SIM_HEIGHT;

  for (let t = 0; t < 3; t++) {
    const base = 20 + t * 7;
    const tableDef = RESTAURANT_TABLES[t];
    const cust = state.customers.find(
      (c) =>
        c.tableIndex === t &&
        (c.state === 'seatedWaiting' || c.state === 'walkingToTable')
    );

    inputs[base] = cust ? 1 : 0;
    inputs[base + 1] = cust
      ? Math.max(0, Math.min(1, 1 - cust.patience / cust.maxPatience))
      : 0;
    inputs[base + 2] = (tableDef.zoneCx - player.x) / REST_SIM_WIDTH;
    inputs[base + 3] = (tableDef.zoneCy - player.y) / REST_SIM_HEIGHT;
    inputs[base + 4] = cust && cust.order.burger && !cust.delivered.burger ? 1 : 0;
    inputs[base + 5] = cust && cust.order.fries && !cust.delivered.fries ? 1 : 0;
    inputs[base + 6] = cust && cust.order.drink && !cust.delivered.drink ? 1 : 0;
  }

  const toPickUp = getOrderToPickUp(state);
  inputs[41] = toPickUp.burger ? 1 : 0;
  inputs[42] = toPickUp.fries ? 1 : 0;
  inputs[43] = toPickUp.drink ? 1 : 0;

  return inputs;
}

export function stepRestaurantWorld(
  player: { x: number; y: number },
  state: RestaurantState,
  prevPlayer?: { x: number; y: number }
): { fitnessDelta: number; episodeEnded: boolean } {
  let fitnessDelta = 0;

  if (state.lastEventTimer > 0) {
    state.lastEventTimer--;
  }

  // Move customers toward their queue/table targets & tick eating
  const survivingCustomers: RestaurantCustomer[] = [];
  for (const c of state.customers) {
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CUSTOMER_WALK_SPEED) {
      c.x += (dx / dist) * CUSTOMER_WALK_SPEED;
      c.y += (dy / dist) * CUSTOMER_WALK_SPEED;
    } else {
      c.x = c.targetX;
      c.y = c.targetY;
      if (c.state === 'walkingToTable') {
        c.state = 'seatedWaiting';
      }
    }

    if (c.state === 'eating') {
      c.eatTimer--;
      if (c.eatTimer <= 0) {
        continue; // Finished eating and departed happily
      }
    }

    survivingCustomers.push(c);
  }
  state.customers = survivingCustomers;

  const prevPx = prevPlayer ? prevPlayer.x : player.x;
  const prevPy = prevPlayer ? prevPlayer.y : player.y;
  const toPickUpBefore = getOrderToPickUp(state);
  const tableOccupied = getOccupiedTableFlags(state.customers);
  const queuingCustomers = state.customers.filter((c) => c.state === 'queuing');
  const hasOpenTable = tableOccupied.some((occ) => !occ);

  // Reward moving closer along vector toward Order Station when customers are waiting in queue
  if (queuingCustomers.length > 0 && hasOpenTable) {
    const orderSt = RESTAURANT_STATIONS.find((s) => s.id === 'order')!;
    const prevDist = Math.hypot(orderSt.zoneCx - prevPx, orderSt.zoneCy - prevPy);
    const currDist = Math.hypot(orderSt.zoneCx - player.x, orderSt.zoneCy - player.y);
    fitnessDelta += (prevDist - currDist) * RESTAURANT_ORDER_VECTOR_REWARD;
  }

  // Reward moving closer along vectors toward stations needed by taken orders
  const stationNeeds: { id: StationKind; needed: boolean }[] = [
    { id: 'burger', needed: toPickUpBefore.burger },
    { id: 'fry', needed: toPickUpBefore.fries },
    { id: 'drink', needed: toPickUpBefore.drink },
  ];
  for (const item of stationNeeds) {
    if (!item.needed) continue;
    const st = RESTAURANT_STATIONS.find((s) => s.id === item.id)!;
    const prevDist = Math.hypot(st.zoneCx - prevPx, st.zoneCy - prevPy);
    const currDist = Math.hypot(st.zoneCx - player.x, st.zoneCy - player.y);
    fitnessDelta += (prevDist - currDist) * RESTAURANT_STATION_VECTOR_REWARD;
  }

  // Reward moving closer along vectors toward tables that need items currently on the tray
  for (const table of RESTAURANT_TABLES) {
    const cust = state.customers.find(
      (c) =>
        c.tableIndex === table.index &&
        (c.state === 'seatedWaiting' || c.state === 'walkingToTable')
    );
    if (!cust) continue;
    const canDeliver =
      (cust.order.burger && !cust.delivered.burger && state.tray.burger) ||
      (cust.order.fries && !cust.delivered.fries && state.tray.fries) ||
      (cust.order.drink && !cust.delivered.drink && state.tray.drink);
    if (!canDeliver) continue;
    const prevDist = Math.hypot(table.zoneCx - prevPx, table.zoneCy - prevPy);
    const currDist = Math.hypot(table.zoneCx - player.x, table.zoneCy - player.y);
    fitnessDelta += (prevDist - currDist) * RESTAURANT_TABLE_VECTOR_REWARD;
  }

  // Check zone occupancy and dwell activation
  let currentActiveZone: string | null = null;

  for (const station of RESTAURANT_STATIONS) {
    if (!pointInRect(player.x, player.y, station.zone)) {
      state.zoneDwell[station.id] = 0;
      continue;
    }
    currentActiveZone = station.id;

    let canActivate = false;
    if (station.id === 'order') {
      const openTableIdx = tableOccupied.findIndex((occ) => !occ);
      canActivate = queuingCustomers.length > 0 && openTableIdx !== -1;
    } else if (station.id === 'burger') {
      canActivate = toPickUpBefore.burger;
    } else if (station.id === 'fry') {
      canActivate = toPickUpBefore.fries;
    } else if (station.id === 'drink') {
      canActivate = toPickUpBefore.drink;
    }

    if (canActivate) {
      if (station.id === 'order') {
        fitnessDelta += RESTAURANT_ORDER_PAD_REWARD;
      } else {
        fitnessDelta += RESTAURANT_STATION_PAD_REWARD;
      }
      const nextDwell = (state.zoneDwell[station.id] ?? 0) + 1;
      if (nextDwell >= RESTAURANT_DWELL_STEPS) {
        state.zoneDwell[station.id] = 0;
        if (station.id === 'order') {
          const openTableIdx = tableOccupied.findIndex((occ) => !occ);
          const front = queuingCustomers[0];
          if (front && openTableIdx !== -1) {
            const tableDef = RESTAURANT_TABLES[openTableIdx];
            const queueRefund = front.queuePenaltyAccrued ?? 0;
            fitnessDelta += queueRefund;
            front.queuePenaltyAccrued = 0;
            front.state = 'walkingToTable';
            front.tableIndex = openTableIdx;
            front.targetX = tableDef.seatX;
            front.targetY = tableDef.seatY;
            front.patience = TABLE_MAX_PATIENCE;
            front.maxPatience = TABLE_MAX_PATIENCE;
            reassignQueueTargets(state.customers);
            state.lastEventText = `Order -> ${tableDef.label} (+${queueRefund.toFixed(1)})`;
            state.lastEventTimer = 60;
          }
        } else if (station.id === 'burger') {
          state.tray.burger = true;
          fitnessDelta += RESTAURANT_ITEM_PICKUP_BONUS;
          state.lastEventText = 'Picked up Burger';
          state.lastEventTimer = 45;
        } else if (station.id === 'fry') {
          state.tray.fries = true;
          fitnessDelta += RESTAURANT_ITEM_PICKUP_BONUS;
          state.lastEventText = 'Picked up Fries';
          state.lastEventTimer = 45;
        } else if (station.id === 'drink') {
          state.tray.drink = true;
          fitnessDelta += RESTAURANT_ITEM_PICKUP_BONUS;
          state.lastEventText = 'Picked up Drink';
          state.lastEventTimer = 45;
        }
      } else {
        state.zoneDwell[station.id] = nextDwell;
      }
    } else {
      state.zoneDwell[station.id] = 0;
    }
  }

  for (const table of RESTAURANT_TABLES) {
    const zKey = `table_${table.index}`;
    if (!pointInRect(player.x, player.y, table.zone)) {
      state.zoneDwell[zKey] = 0;
      continue;
    }
    currentActiveZone = zKey;

    const seated = state.customers.find(
      (c) =>
        c.tableIndex === table.index &&
        (c.state === 'seatedWaiting' || c.state === 'walkingToTable')
    );
    const hasDeliverable =
      Boolean(seated) &&
      ((seated!.order.burger && !seated!.delivered.burger && state.tray.burger) ||
        (seated!.order.fries && !seated!.delivered.fries && state.tray.fries) ||
        (seated!.order.drink && !seated!.delivered.drink && state.tray.drink));

    if (hasDeliverable && seated) {
      fitnessDelta += RESTAURANT_TABLE_PAD_REWARD;
      const nextDwell = (state.zoneDwell[zKey] ?? 0) + 1;
      if (nextDwell >= RESTAURANT_DWELL_STEPS) {
        state.zoneDwell[zKey] = 0;
        let deliveredCount = 0;
        if (seated.order.burger && !seated.delivered.burger && state.tray.burger) {
          seated.delivered.burger = true;
          state.tray.burger = false;
          deliveredCount++;
        }
        if (seated.order.fries && !seated.delivered.fries && state.tray.fries) {
          seated.delivered.fries = true;
          state.tray.fries = false;
          deliveredCount++;
        }
        if (seated.order.drink && !seated.delivered.drink && state.tray.drink) {
          seated.delivered.drink = true;
          state.tray.drink = false;
          deliveredCount++;
        }
        fitnessDelta += deliveredCount * RESTAURANT_DELIVER_ITEM_BONUS;

        const complete =
          (!seated.order.burger || seated.delivered.burger) &&
          (!seated.order.fries || seated.delivered.fries) &&
          (!seated.order.drink || seated.delivered.drink);

        if (complete) {
          seated.state = 'eating';
          seated.eatTimer = EAT_DURATION_STEPS;
          state.customersServed++;
          fitnessDelta += RESTAURANT_SERVE_COMPLETE_BONUS;
          state.lastEventText = `Served ${table.label}!`;
          state.lastEventTimer = 60;
        } else {
          state.lastEventText = `Partial drop @ ${table.label}`;
          state.lastEventTimer = 45;
        }
      } else {
        state.zoneDwell[zKey] = nextDwell;
      }
    } else {
      state.zoneDwell[zKey] = 0;
    }
  }
  state.activeZoneId = currentActiveZone;

  // Minimal fixed waiting and customer-left penalties
  const remainingAfterPatience: RestaurantCustomer[] = [];
  let queueChanged = false;
  for (const c of state.customers) {
    if (c.state === 'queuing' || c.state === 'seatedWaiting') {
      c.patience--;
      state.totalWaitTicks++;
      fitnessDelta += RESTAURANT_WAIT_PENALTY_PER_CUSTOMER;
      if (c.state === 'queuing') {
        c.queuePenaltyAccrued = (c.queuePenaltyAccrued ?? 0) + Math.abs(RESTAURANT_WAIT_PENALTY_PER_CUSTOMER);
      }

      if (c.patience <= 0) {
        state.customersLeft++;
        fitnessDelta += RESTAURANT_LEAVE_PENALTY;
        state.lastEventText =
          c.tableIndex !== null
            ? `Customer left ${RESTAURANT_TABLES[c.tableIndex].label}!`
            : 'Customer left queue!';
        state.lastEventTimer = 75;
        if (c.state === 'queuing') queueChanged = true;
        continue;
      }
    }
    remainingAfterPatience.push(c);
  }
  state.customers = remainingAfterPatience;
  if (queueChanged) {
    reassignQueueTargets(state.customers);
  }

  // Spawn new customers into the Order Station queue
  state.spawnCooldown--;
  const currentQueueCount = state.customers.filter((c) => c.state === 'queuing').length;
  if (
    state.spawnCooldown <= 0 &&
    state.customers.length < MAX_ACTIVE_CUSTOMERS &&
    currentQueueCount < QUEUE_SPOTS.length
  ) {
    const newCust = createCustomer(state.nextCustomerId++, currentQueueCount, false);
    state.customers.push(newCust);
    state.spawnCooldown = SPAWN_INTERVAL_STEPS;
  }

  const episodeEnded = state.customersLeft >= RESTAURANT_MAX_WALKOUTS;
  return { fitnessDelta, episodeEnded };
}

export function evaluateRestaurantSpatialProbe(
  px: number,
  py: number,
  vx: number,
  vy: number,
  state: RestaurantState
): { fitness: number; hit: boolean } {
  // Spatial heuristic surface showing immediate waiting pressure + distance to useful active target
  const waitingCount = state.customers.filter(
    (c) => c.state === 'queuing' || c.state === 'seatedWaiting'
  ).length;
  let score = waitingCount * RESTAURANT_WAIT_PENALTY_PER_CUSTOMER * 20;

  const nx = Math.max(6, Math.min(REST_SIM_WIDTH - 6, px + vx));
  const ny = Math.max(6, Math.min(REST_SIM_HEIGHT - 6, py + vy));

  const targets: { x: number; y: number }[] = [];
  const tableOcc = getOccupiedTableFlags(state.customers);
  const hasQueue = state.customers.some((c) => c.state === 'queuing');
  if (hasQueue && tableOcc.some((o) => !o)) {
    const ord = RESTAURANT_STATIONS.find((s) => s.id === 'order')!;
    targets.push({ x: ord.zoneCx, y: ord.zoneCy });
    if (pointInRect(nx, ny, ord.zone)) {
      score += RESTAURANT_ORDER_PAD_REWARD;
    }
  }

  for (const c of state.customers) {
    if (
      (c.state === 'seatedWaiting' || c.state === 'walkingToTable') &&
      c.tableIndex !== null
    ) {
      const table = RESTAURANT_TABLES[c.tableIndex];
      const needB = c.order.burger && !c.delivered.burger;
      const needF = c.order.fries && !c.delivered.fries;
      const needD = c.order.drink && !c.delivered.drink;
      if (
        (needB && state.tray.burger) ||
        (needF && state.tray.fries) ||
        (needD && state.tray.drink)
      ) {
        targets.push({ x: table.zoneCx, y: table.zoneCy });
        if (pointInRect(nx, ny, table.zone)) {
          score += RESTAURANT_TABLE_PAD_REWARD;
        }
      }
      if (needB && !state.tray.burger) {
        const st = RESTAURANT_STATIONS.find((s) => s.id === 'burger')!;
        targets.push({ x: st.zoneCx, y: st.zoneCy });
        if (pointInRect(nx, ny, st.zone)) {
          score += RESTAURANT_STATION_PAD_REWARD;
        }
      }
      if (needF && !state.tray.fries) {
        const st = RESTAURANT_STATIONS.find((s) => s.id === 'fry')!;
        targets.push({ x: st.zoneCx, y: st.zoneCy });
        if (pointInRect(nx, ny, st.zone)) {
          score += RESTAURANT_STATION_PAD_REWARD;
        }
      }
      if (needD && !state.tray.drink) {
        const st = RESTAURANT_STATIONS.find((s) => s.id === 'drink')!;
        targets.push({ x: st.zoneCx, y: st.zoneCy });
        if (pointInRect(nx, ny, st.zone)) {
          score += RESTAURANT_STATION_PAD_REWARD;
        }
      }
    }
  }

  if (targets.length > 0) {
    let bestDist = Infinity;
    for (const t of targets) {
      const d = Math.hypot(t.x - nx, t.y - ny);
      if (d < bestDist) bestDist = d;
    }
    score += Math.max(0, 350 - bestDist) * 0.25;
  }

  return { fitness: score, hit: false };
}

function drawOrderPips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  order: OrderItems,
  delivered?: OrderItems
): void {
  const items: { key: keyof OrderItems; letter: string; color: string }[] = [
    { key: 'burger', letter: 'B', color: '#f59e0b' },
    { key: 'fries', letter: 'F', color: '#eab308' },
    { key: 'drink', letter: 'D', color: '#38bdf8' },
  ];
  const active = items.filter((it) => order[it.key]);
  const totalW = active.length * 14 - 2;
  let cx = x - totalW * 0.5;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const it of active) {
    const isDone = Boolean(delivered?.[it.key]);
    ctx.fillStyle = isDone ? it.color : '#14171f';
    ctx.strokeStyle = it.color;
    ctx.lineWidth = 1;
    ctx.fillRect(cx, y - 6, 12, 12);
    ctx.strokeRect(cx, y - 6, 12, 12);
    ctx.fillStyle = isDone ? '#090b0f' : it.color;
    ctx.fillText(it.letter, cx + 6, y + 0.5);
    cx += 14;
  }
  ctx.textAlign = 'left';
}

export function drawRestaurantArena(
  ctx: CanvasRenderingContext2D,
  player: { x: number; y: number },
  state: RestaurantState
): void {
  // Floor
  ctx.fillStyle = '#090b0f';
  ctx.fillRect(0, 0, REST_SIM_WIDTH, REST_SIM_HEIGHT);

  // Subtle floor tile grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < REST_SIM_WIDTH; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, REST_SIM_HEIGHT);
    ctx.stroke();
  }
  for (let gy = 40; gy < REST_SIM_HEIGHT; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(REST_SIM_WIDTH, gy);
    ctx.stroke();
  }

  // Entrance door marker (bottom-left)
  ctx.fillStyle = '#18222e';
  ctx.strokeStyle = '#38516b';
  ctx.lineWidth = 1;
  ctx.fillRect(8, REST_SIM_HEIGHT - 12, 36, 10);
  ctx.strokeRect(8, REST_SIM_HEIGHT - 12, 36, 10);
  ctx.fillStyle = '#7aa2c7';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DOOR', 26, REST_SIM_HEIGHT - 7);
  ctx.textAlign = 'left';

  // Queue lane guide dots
  for (let i = 0; i < QUEUE_SPOTS.length; i++) {
    const sp = QUEUE_SPOTS[i];
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  const toPickUp = getOrderToPickUp(state);
  const hasWaitingOrder =
    state.customers.some((c) => c.state === 'queuing') &&
    getOccupiedTableFlags(state.customers).some((occ) => !occ);

  // Draw kitchen stations + front activation zones
  for (const station of RESTAURANT_STATIONS) {
    const isZoneActive = state.activeZoneId === station.id;
    const dwell = state.zoneDwell[station.id] ?? 0;
    const isNeededTarget =
      (station.id === 'order' && hasWaitingOrder) ||
      (station.id === 'burger' && toPickUp.burger) ||
      (station.id === 'fry' && toPickUp.fries) ||
      (station.id === 'drink' && toPickUp.drink);

    // Front activation zone
    ctx.save();
    ctx.fillStyle = isZoneActive
      ? 'rgba(255, 255, 255, 0.1)'
      : isNeededTarget
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(station.zone.x, station.zone.y, station.zone.w, station.zone.h);
    ctx.strokeStyle = station.color;
    ctx.globalAlpha = isZoneActive ? 0.95 : isNeededTarget ? 0.78 : 0.35;
    ctx.lineWidth = isZoneActive || isNeededTarget ? 1.8 : 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(station.zone.x, station.zone.y, station.zone.w, station.zone.h);
    ctx.restore();

    if (dwell > 0) {
      const pct = Math.min(1, dwell / RESTAURANT_DWELL_STEPS);
      ctx.fillStyle = station.color;
      ctx.fillRect(station.zone.x + 4, station.zone.y + station.zone.h - 6, (station.zone.w - 8) * pct, 3);
    }

    // Counter body
    ctx.fillStyle = '#181c24';
    ctx.fillRect(station.counter.x, station.counter.y, station.counter.w, station.counter.h);
    ctx.strokeStyle = station.color;
    ctx.lineWidth = isNeededTarget ? 2 : 1.5;
    ctx.strokeRect(station.counter.x, station.counter.y, station.counter.w, station.counter.h);

    ctx.fillStyle = station.color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      station.label,
      station.counter.x + station.counter.w * 0.5,
      station.counter.y + station.counter.h * 0.5
    );
    ctx.textAlign = 'left';
  }

  // Draw 3 dining room tables + front service zones
  for (const table of RESTAURANT_TABLES) {
    const zKey = `table_${table.index}`;
    const isZoneActive = state.activeZoneId === zKey;
    const dwell = state.zoneDwell[zKey] ?? 0;
    const seatedCust = state.customers.find((c) => c.tableIndex === table.index);

    // Table service zone
    ctx.save();
    ctx.fillStyle = isZoneActive ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.03)';
    ctx.fillRect(table.zone.x, table.zone.y, table.zone.w, table.zone.h);
    ctx.strokeStyle = seatedCust ? '#10b981' : '#3b4a5e';
    ctx.globalAlpha = isZoneActive ? 0.95 : 0.5;
    ctx.lineWidth = isZoneActive ? 1.8 : 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(table.zone.x, table.zone.y, table.zone.w, table.zone.h);
    ctx.restore();

    if (dwell > 0) {
      const pct = Math.min(1, dwell / RESTAURANT_DWELL_STEPS);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(table.zone.x + 4, table.zone.y + table.zone.h - 6, (table.zone.w - 8) * pct, 3);
    }

    // Table surface
    ctx.fillStyle = '#1c212b';
    ctx.fillRect(table.tableRect.x, table.tableRect.y, table.tableRect.w, table.tableRect.h);
    ctx.strokeStyle = seatedCust ? '#10b981' : '#4b5563';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(table.tableRect.x, table.tableRect.y, table.tableRect.w, table.tableRect.h);

    ctx.fillStyle = seatedCust ? '#d1fae5' : '#9ca3af';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (seatedCust) {
      ctx.fillText(
        table.label,
        table.tableRect.x + table.tableRect.w * 0.5,
        table.tableRect.y + 10
      );
      drawOrderPips(
        ctx,
        table.tableRect.x + table.tableRect.w * 0.5,
        table.tableRect.y + 24,
        seatedCust.order,
        seatedCust.delivered
      );
    } else {
      ctx.fillText(
        table.label,
        table.tableRect.x + table.tableRect.w * 0.5,
        table.tableRect.y + table.tableRect.h * 0.5
      );
    }
    ctx.textAlign = 'left';
  }

  // Draw customers
  for (const c of state.customers) {
    const patienceRatio = Math.max(0, Math.min(1, c.patience / c.maxPatience));
    const bodyColor =
      c.state === 'eating'
        ? '#34d399'
        : patienceRatio > 0.5
        ? '#e5e7eb'
        : patienceRatio > 0.25
        ? '#fbbf24'
        : '#f87171';

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Patience bar + state tag (dual-coded, never hue-only)
    if (c.state === 'queuing' || c.state === 'seatedWaiting') {
      const barW = 22;
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(c.x - barW * 0.5, c.y - 15, barW, 4);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(c.x - barW * 0.5, c.y - 15, barW * patienceRatio, 4);
    } else if (c.state === 'eating') {
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EAT', c.x, c.y - 11);
      ctx.textAlign = 'left';
    }

    if (c.state === 'queuing') {
      drawOrderPips(ctx, c.x - 24, c.y, c.order);
    }
  }

  // Subtle target vectors from agent to needed stations & deliverable tables
  ctx.save();
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  const activeStationVectors: { id: StationKind; needed: boolean }[] = [
    { id: 'order', needed: hasWaitingOrder },
    { id: 'burger', needed: toPickUp.burger },
    { id: 'fry', needed: toPickUp.fries },
    { id: 'drink', needed: toPickUp.drink },
  ];
  for (const sv of activeStationVectors) {
    if (!sv.needed) continue;
    const st = RESTAURANT_STATIONS.find((s) => s.id === sv.id)!;
    ctx.strokeStyle = st.color;
    ctx.globalAlpha = 0.38;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(st.zoneCx, st.zoneCy);
    ctx.stroke();
  }
  for (const table of RESTAURANT_TABLES) {
    const cust = state.customers.find(
      (c) =>
        c.tableIndex === table.index &&
        (c.state === 'seatedWaiting' || c.state === 'walkingToTable')
    );
    if (!cust) continue;
    const hasMatch =
      (cust.order.burger && !cust.delivered.burger && state.tray.burger) ||
      (cust.order.fries && !cust.delivered.fries && state.tray.fries) ||
      (cust.order.drink && !cust.delivered.drink && state.tray.drink);
    if (!hasMatch) continue;
    ctx.strokeStyle = '#10b981';
    ctx.globalAlpha = 0.38;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(table.zoneCx, table.zoneCy);
    ctx.stroke();
  }
  ctx.restore();

  // Draw agent (cyan square matching Evasion Mode) + 3-slot tray & active order-to-fill indicators
  ctx.fillStyle = '#0ff';
  ctx.fillRect(player.x - 6, player.y - 6, 12, 12);

  const trayItems: { held: boolean; needed: boolean; letter: string; color: string }[] = [
    { held: state.tray.burger, needed: toPickUp.burger, letter: 'B', color: '#f59e0b' },
    { held: state.tray.fries, needed: toPickUp.fries, letter: 'F', color: '#eab308' },
    { held: state.tray.drink, needed: toPickUp.drink, letter: 'D', color: '#38bdf8' },
  ];
  let tx = player.x - 19;
  const ty = player.y - 16;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const slot of trayItems) {
    ctx.fillStyle = slot.held ? slot.color : '#11151d';
    ctx.strokeStyle = slot.held ? '#fff' : slot.needed ? slot.color : '#334155';
    ctx.lineWidth = slot.needed && !slot.held ? 1.5 : 1;
    ctx.fillRect(tx, ty, 11, 10);
    ctx.strokeRect(tx, ty, 11, 10);
    ctx.fillStyle = slot.held ? '#090b0f' : slot.needed ? slot.color : '#475569';
    ctx.fillText(slot.letter, tx + 5.5, ty + 5.5);
    tx += 13;
  }
  ctx.textAlign = 'left';

  // Quiet corner HUD metrics
  const qCount = state.customers.filter((c) => c.state === 'queuing').length;
  ctx.fillStyle = 'rgba(9, 11, 15, 0.78)';
  ctx.fillRect(6, REST_SIM_HEIGHT - 30, 210, 16);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `SERVED:${state.customersServed}  LEFT:${state.customersLeft}/${RESTAURANT_MAX_WALKOUTS}  Q:${qCount}`,
    10,
    REST_SIM_HEIGHT - 22
  );

  if (state.lastEventTimer > 0 && state.lastEventText) {
    ctx.fillStyle = 'rgba(9, 11, 15, 0.8)';
    ctx.fillRect(REST_SIM_WIDTH - 196, REST_SIM_HEIGHT - 26, 190, 18);
    ctx.fillStyle = '#0ff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(state.lastEventText, REST_SIM_WIDTH - 10, REST_SIM_HEIGHT - 17);
    ctx.textAlign = 'left';
  }
}
