from flask import Flask, render_template, request, jsonify, send_from_directory
from traffic_prediction import TrafficPredictor
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_folder='infra-alerting-dashboard/build', static_url_path='')
CORS(app)
predictor = TrafficPredictor()

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        start_lat = float(data['start_lat'])
        start_lon = float(data['start_lon'])
        end_lat = float(data['end_lat'])
        end_lon = float(data['end_lon'])
        
        # Get route and prediction
        route = predictor.get_route((start_lat, start_lon), (end_lat, end_lon))
        
        if not route:
            return jsonify({'error': 'Could not calculate route'}), 400
            
        traffic_prediction = predictor.predict_traffic(route)
        
        # Generate map visualization
        predictor.visualize_route(route, traffic_prediction)
        
        return jsonify({
            'route': route,
            'prediction': traffic_prediction,
            'map_url': '/static/route_map.html'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True) 