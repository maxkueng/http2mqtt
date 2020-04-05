http2mqtt
=========

A bridge to connect HTTP-based IoT devices to MQTT. Supports Home Assistant
discovery.

Note: This project is still in development and new releases might introduce
unannounced breaking changes regularly.

## Supported Devices

 - [myStrom WiFi Button](https://mystrom.ch/wifi-button/)
 - [myStrom WiFi Button Plus](https://mystrom.ch/wifi-button-plus/)

## Example Configuration

 - `http.host`: Interface IP for the HTTP server to listen on
 - `http.port`: Port for the HTTP server to listen on
 - `mqtt.broker`: MQTT Broker URL
 - `mqtt.username` _(optional)_: MQTT broker username
 - `mqtt.password` _(optional)_: MQTT broker password
 - `mqtt.homeAssistant.discovery` _(optional)_: Enable publishing discovery
   information for Home Assistant 
 - `options.PLUGIN_NAME` _(optional): Plugin-specific options_

### myStrom Buttons Plugin Options

 - `mystrom-buttons.route`: Route path under which to handle actions from the
   buttons
 - `mystrom-buttons.mqttTopic`: MQTT topic prefix under which to publish button
   states
 - `mystrom-buttons.buttons`: Configuration for each button. Only buttons
   configured here will be handled.  

#### Button Configuration

 - `mac`: MAC address of the button
 - `name`: A friendly name for the button
 - `type`: Either `"button"` or `"button-plus"` for myStrom Wifi button or
   myStrom Wifi Button Plus respectively

 - `wheelMin` _(button-plus only)_: Minimum value for the wheel
 - `wheelMax` _(button-plus only)_: Maximum value for the wheel 
 - `wheelSpeed` _(button-plus only; optional; default: 1)_: Multiplier for the
   wheel value. Higher number means fewer rotations to go from `wheelMin` to
   `wheelMax` and vice versa

```json
{
  "http": {
    "host": "0.0.0.0",
    "port": 8321
  },
  "mqtt": {
    "broker": "mqtt://10.13.37.42:1883",
    "username": "user",
    "password": "secret"
  },
  "homeAssistant": {
    "discovery": "yes"
  },
  "options": {
    "mystrom-buttons": {
      "route": "/mystrom/generic",
      "mqttTopic": "myStrom/wifiButtons",
      "buttons": [
        {
          "mac": "ABCDEDA1B2C3",
          "name": "Kitchen Wifi Button Plus",
          "type": "button-plus",
          "wheelMin": 0,
          "wheelMax": 255,
          "wheelSpeed": 2.5
        },
        {
          "mac": "A3A4A5B1B2B3",
          "name": "Bathroom Wifi Button",
          "type": "button"
        }
      ]
    }
  }
}
```

## License

Copyright (c) 2020 Max Kueng

MIT License