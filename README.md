http2mqtt
=========

A bridge to connect HTTP-based IoT devices to MQTT. Supports Home Assistant
discovery.

Note: This project is still in development and new releases might introduce
unannounced breaking changes regularly.

## Supported Devices

 - [myStrom WiFi Button](https://mystrom.ch/wifi-button/)
 - [myStrom WiFi Button Plus](https://mystrom.ch/wifi-button-plus/)
 - [myStrom WiFi Switch](https://mystrom.ch/wifi-switch-ch/)

## Home Assistant Discovery

Note that _Device Triggers_ won't show up as entities under the device. They
are, however, available as triggers in the automation editor UI.

### myStrom WiFi Button

| Name         | Device Type                       | Trigger Type          | Trigger Subtype | Value              | Units |
| ------------ | --------------------------------- | --------------------- | --------------- | ------------------ | ----- |
| Single Press | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_1`      |                    |       |
| Double Press | [Device Trigger][hadevicetrigger] | `button_double_press` | `button_1`      |                    |       |
| Long Press   | [Device Trigger][hadevicetrigger] | `button_long_press`   | `button_1`      |                    |       |
| Battery      | [Sensor][hasensor]                |                       |                 | Battery percentage | `%`   |

### myStrom WiFi Button Plus

| Name         | Device Type                       | Trigger Type          | Trigger Subtype | Value                                    | Units |
| ------------ | --------------------------------- | --------------------- | --------------- | ---------------------------------------- | ----- |
| Single Press | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_1`      |                                          |       |
| Double Press | [Device Trigger][hadevicetrigger] | `button_double_press` | `button_1`      |                                          |       |
| Long Press   | [Device Trigger][hadevicetrigger] | `button_long_press`   | `button_1`      |                                          |       |
| Touch        | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_2`      |                                          |       |
| Wheel        | [Sensor][hasensor]                |                       |                 | Number between `wheelMin` and `wheelMax` |       |
| Wheel Final  | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_3`      |                                          |       |
| Battery      | [Sensor][hasensor]                |                       |                 | Percentage                               | `%`   |

### myStrom WiFi Switch

| Name        | Device Type        | Value       | Units |
| ----------- | ------------------ | ----------- | ----- |
| Relay       | [Switch][haswitch] |             |       |
| Power       | [Sensor][hasensor] | Power usage | `W`   |
| Temperature | [Sensor][hasensor] | Temperature | `°C`  |

[hadevicetrigger]: https://www.home-assistant.io/integrations/device_trigger.mqtt/
[hasensor]: https://www.home-assistant.io/integrations/sensor.mqtt/
[haswitch]: https://www.home-assistant.io/integrations/switch.mqtt/

## Configuration

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

### myStrom Switch Plugin Options

 - `mystrom-switch.mqttTopic`: MQTT topic prefix under which to publish switch
   states
 - `mystrom-switch.switches`: Configuration for each switch. Only switches
   configured here will be handled.

#### Switch Configuration

 - `host`: Host or IP address of the switch.
 - `name`: A friendly name for the switch

### Example

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
    },
    "mystrom-switch": {
      "mqttTopic": "myStrom/wifiSwitches",
      "switches": [
        {
          "host": "10.13.37.42",
          "name": "Wifi Switch 1"
        },
        {
          "host": "10.13.37.43",
          "name": "Wifi Switch 2"
        }
      ]
    }
  }
}
```

## License

Copyright (c) 2020 Max Kueng

MIT License