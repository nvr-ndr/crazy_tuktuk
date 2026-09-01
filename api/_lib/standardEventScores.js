const EVENT_SCORES = {
  'green_light_miracle:miracle': 40, 'motorbike_swarm:swarm': 35, 'monitor_lizard:lizard': 50,
  'pigeon_apocalypse:pigeons': 75, 'mystery_soi:shortcut_win': 45, 'train_crossing:around': 15,
  'the_puddle:splash': 60, 'cat_in_road:stop': 15, 'cat_in_road:maneuver': 25,
  'running_on_fumes:push_win': 40, 'street_food_stop:food': 20, 'rival_tuktuk:race_win': 120,
  'rival_tuktuk:race_loss': 30, 'songkran_ambush:songkran': 140, 'elephant_traffic:elephant': 160,
  'ghost_passenger:ghost': 100, 'perfect_gap:gap': 100, 'movie_set_blockade:film': 80,
  'lucky_shrine:blessed': 35, 'shortcut_passenger:shortcut_passenger_result': 55,
  'wave_through:wave_through_result': 25, 'flash_flood:flash_flood_result': 65,
  'pig_escape:pig_escape_result': 85, 'money_road:money_road_result': 15,
  'mystery_rattle:mystery_rattle_result': 20,
  'traffic_gridlock:gridlock': 0, 'market_spillover:spill': 0, 'monsoon_burst:rain': 0,
  'engine_sputter:sputter': 0, 'mystery_soi:shortcut_fail': 0, 'mystery_soi:safe': 0,
  'train_crossing:waited': 0, 'the_puddle:stall': 0, 'the_puddle:slow': 0,
  'running_on_fumes:push_fail': 0, 'running_on_fumes:gentle': 0, 'street_food_stop:continue': 0,
  'rival_tuktuk:ignore': 0, 'funeral_procession:respect': 0, 'funeral_procession:detour': 0, 'lucky_shrine:pass': 0,
  'marathon_crossing:marathon_crossing_result': 0, 'shortcut_passenger:shortcut_passenger_result': 55,
  'surprise_roadworks:surprise_roadworks_result': 0, 'delivery_truck:delivery_truck_result': 0,
  'road_block:road_block_result': 0, 'heatwave:heatwave_result': 0, 'fallen_branch:fallen_branch_result': 0,
  'tailwind:tailwind_result': 0, 'forgot_phone:forgot_phone_result': 0, 'photo_stop:photo_stop_result': 0,
  'pigeon_apocalypse:pigeons': 75,
};

function getStandardEventPoints(eventId, outcomeId) {
  if (!eventId && !outcomeId) return 0;
  const key = `${eventId || ''}:${outcomeId || ''}`;
  if (!Object.prototype.hasOwnProperty.call(EVENT_SCORES, key)) return null;
  return Math.max(-40, Math.min(40, EVENT_SCORES[key]));
}

module.exports = { getStandardEventPoints, EVENT_SCORES };
