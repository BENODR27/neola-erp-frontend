import { environment } from '../../shared/environments/environment';

export const WMS_API_CONSTANTS = {
  API_URL: environment.apiUrl,
  sourcingAsnDetail: '/api/wms/SourcingAsnDetail',
  FabricCollection: '/api/wms/FabricCollection',
  IssueFabricFactory: '/api/wms/IssueFabricFactory',
  IssuedFabricInspection: '/api/wms/IssuedFabricInspection',
  Rack: '/api/wms/Rack',
  BayLevelBin: '/api/wms/BayLevelBin',
  WareHouse: '/api/wms/WareHouse',
  Factory: '/api/wms/Factory',
  Bay: '/api/wms/Bay',
  BayLevel: '/api/wms/BayLevel',
  cf: '/api/wms/cf',
  OcReallocationRequest: '/api/wms/OcReallocationRequest',
  // Add other endpoints here as needed
};
