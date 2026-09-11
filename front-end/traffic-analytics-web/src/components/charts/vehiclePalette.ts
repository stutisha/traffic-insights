const VEHICLE_PALETTE = ["#567C8D", "#789A7A", "#B08968", "#8A7A9B", "#C29B61"] as const

export function getVehicleChartColor(index: number): string {
  return VEHICLE_PALETTE[index % VEHICLE_PALETTE.length]
}
