import osmnx as ox
import networkx as nx
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from typing import Tuple, List, Dict
import folium
from folium import plugins

class TrafficPredictor:
    def __init__(self, city: str = "Chennai, Tamil Nadu, India"):
        """Initialize the traffic predictor with a city."""
        self.city = city
        self.G = None
        self.traffic_data = {}
        self.load_road_network()
    
    def load_road_network(self):
        """Load the road network for the specified city."""
        try:
            # Download and cache the road network
            self.G = ox.graph_from_place(self.city, network_type='drive')
            
            # Project the graph to UTM
            self.G = ox.project_graph(self.G, to_crs='EPSG:4326')
            
            print(f"Loaded road network for {self.city}")
        except Exception as e:
            print(f"Error loading road network: {e}")
            raise
    
    def get_route(self, start_point: Tuple[float, float], 
                  end_point: Tuple[float, float]) -> List[Tuple[float, float]]:
        """Get the actual route between two points."""
        try:
            # Find nearest nodes to the input coordinates
            start_node = ox.nearest_nodes(self.G, start_point[1], start_point[0])
            end_node = ox.nearest_nodes(self.G, end_point[1], end_point[0])
            
            # Calculate the shortest path
            route = nx.shortest_path(self.G, start_node, end_node, weight='length')
            
            # Get the route coordinates
            route_coords = []
            for node in route:
                route_coords.append((self.G.nodes[node]['y'], self.G.nodes[node]['x']))
            
            return route_coords
        except Exception as e:
            print(f"Error calculating route: {e}")
            return []
    
    def predict_traffic(self, route: List[Tuple[float, float]], 
                       current_time: datetime = None) -> Dict:
        """Predict traffic conditions along a route."""
        if current_time is None:
            current_time = datetime.now()
        
        # Simulate traffic prediction based on time of day
        hour = current_time.hour
        
        # Simple traffic model based on time of day
        if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
            traffic_level = "Heavy"
            delay_factor = 1.5
        elif 23 <= hour or hour <= 5:  # Late night
            traffic_level = "Light"
            delay_factor = 1.1
        else:  # Normal hours
            traffic_level = "Moderate"
            delay_factor = 1.2
        
        # Calculate estimated travel time (simplified)
        total_distance = self._calculate_route_distance(route)
        base_speed = 30  # km/h
        estimated_time = (total_distance / base_speed) * delay_factor
        
        return {
            "traffic_level": traffic_level,
            "delay_factor": delay_factor,
            "estimated_time_minutes": round(estimated_time * 60, 1),
            "total_distance_km": round(total_distance, 1)
        }
    
    def _calculate_route_distance(self, route: List[Tuple[float, float]]) -> float:
        """Calculate the total distance of a route in kilometers."""
        total_distance = 0
        for i in range(len(route) - 1):
            total_distance += self._haversine_distance(route[i], route[i + 1])
        return total_distance
    
    def _haversine_distance(self, point1: Tuple[float, float], 
                           point2: Tuple[float, float]) -> float:
        """Calculate the Haversine distance between two points in kilometers."""
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = point1
        lat2, lon2 = point2
        
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        
        a = (np.sin(dlat/2) * np.sin(dlat/2) +
             np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) *
             np.sin(dlon/2) * np.sin(dlon/2))
        
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        distance = R * c
        
        return distance
    
    def visualize_route(self, route: List[Tuple[float, float]], 
                       traffic_prediction: Dict) -> None:
        """Visualize the route on a map with traffic information."""
        # Create a map centered on the route
        center_lat = sum(coord[0] for coord in route) / len(route)
        center_lon = sum(coord[1] for coord in route) / len(route)
        m = folium.Map(location=[center_lat, center_lon], zoom_start=13)
        
        # Add the route to the map
        folium.PolyLine(
            route,
            weight=3,
            color='blue',
            opacity=0.8
        ).add_to(m)
        
        # Add markers for start and end points
        folium.Marker(
            route[0],
            popup='Start',
            icon=folium.Icon(color='green', icon='info-sign')
        ).add_to(m)
        
        folium.Marker(
            route[-1],
            popup='End',
            icon=folium.Icon(color='red', icon='info-sign')
        ).add_to(m)
        
        # Add traffic information
        traffic_info = f"""
        Traffic Level: {traffic_prediction['traffic_level']}
        Estimated Time: {traffic_prediction['estimated_time_minutes']} minutes
        Total Distance: {traffic_prediction['total_distance_km']} km
        """
        
        folium.Popup(
            traffic_info,
            max_width=300
        ).add_to(m)
        
        # Save the map
        m.save('route_map.html')
        print("Map saved as 'route_map.html'")

def main():
    # Example usage
    predictor = TrafficPredictor()
    
    # Example coordinates (Chennai landmarks)
    start_point = (13.0827, 80.2707)  # Chennai Central
    end_point = (13.0067, 80.2207)    # Chennai Airport
    
    # Get the route
    route = predictor.get_route(start_point, end_point)
    
    if route:
        # Predict traffic
        traffic_prediction = predictor.predict_traffic(route)
        
        # Visualize the route
        predictor.visualize_route(route, traffic_prediction)
        
        # Print traffic information
        print("\nTraffic Prediction:")
        print(f"Traffic Level: {traffic_prediction['traffic_level']}")
        print(f"Estimated Time: {traffic_prediction['estimated_time_minutes']} minutes")
        print(f"Total Distance: {traffic_prediction['total_distance_km']} km")
    else:
        print("Could not calculate route")

if __name__ == "__main__":
    main() 