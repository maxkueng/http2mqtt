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
 - [Edimax Smart Plug SP-2101W V2](https://www.edimax.com/edimax/merchandise/merchandise_detail/data/edimax/uk/home_automation_smart_plug/sp-2101w_v2/)
 - [Edimax Smart Plug SP-1101W V2](https://www.edimax.com/edimax/merchandise/merchandise_detail/data/edimax/uk/home_automation_smart_plug/sp-1101w_v2/) _(untested)_
 - [Edimax Smart Plug SP-2101W](https://www.edimax.com/edimax/merchandise/merchandise_detail/data/edimax/uk/home_automation_smart_plug/sp-2101w/) _(untested)_
 - [Edimax Smart Plug SP-1101W](https://www.edimax.com/edimax/merchandise/merchandise_detail/data/edimax/uk/home_automation_smart_plug/sp-1101w/) _(untested)_

_NOTE: If your Edimax plug uses recent firmware (v3) and you don't know your
plug's password, please refer to [this guide][ediplug-troubleshoot] on how to
factory-reset your plug and obtain its auto-generated password during setup._

[ediplug-troubleshoot]: https://github.com/maxkueng/ediplug#troubleshooting

## Home Assistant Discovery

Note that _Device Triggers_ won't show up as entities under the device. They
are, however, available as triggers in the automation editor UI.

### myStrom WiFi Button

| Name         | Device Type                       | Trigger Type          | Trigger Subtype | Value              | Units |
| ------------ | --------------------------------- | --------------------- | --------------- | ------------------ | ----- |
| Single Press | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_1`      |                    |       |
| Double Press | [Device Trigger][hadevicetrigger] | `button_double_press` | `button_1`      |                    |       |
| Long Press   | [Device Trigger][hadevicetrigger] | `button_long_press`   | `button_1`      |                    |       |
| Battery      | [Sensor][hasensor]                |                       |                 | Battery level      | `%`   |

### myStrom WiFi Button Plus

| Name         | Device Type                       | Trigger Type          | Trigger Subtype | Value                                    | Units |
| ------------ | --------------------------------- | --------------------- | --------------- | ---------------------------------------- | ----- |
| Single Press | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_1`      |                                          |       |
| Double Press | [Device Trigger][hadevicetrigger] | `button_double_press` | `button_1`      |                                          |       |
| Long Press   | [Device Trigger][hadevicetrigger] | `button_long_press`   | `button_1`      |                                          |       |
| Touch        | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_2`      |                                          |       |
| Wheel        | [Sensor][hasensor]                |                       |                 | Number between `wheelMin` and `wheelMax` |       |
| Wheel Final  | [Device Trigger][hadevicetrigger] | `button_short_press`  | `button_3`      |                                          |       |
| Battery      | [Sensor][hasensor]                |                       |                 | Percentage level                         | `%`   |

### myStrom WiFi Switch

| Name        | Device Type        | Value       | Units |
| ----------- | ------------------ | ----------- | ----- |
| Relay       | [Switch][haswitch] |             |       |
| Power       | [Sensor][hasensor] | Power usage | `W`   |
| Temperature | [Sensor][hasensor] | Temperature | `°C`  |

### Edimax Smart Plug

| Name        | Device Type        | Value                    | Units |
| ----------- | ------------------ | ------------------------ | ----- |
| Relay       | [Switch][haswitch] |                          |       |
| Power       | [Sensor][hasensor] | Power usage              | `W`   |
| Amperage    | [Sensor][hasensor] | Power current / amperage | `A`   |

[hadevicetrigger]: https://www.home-assistant.io/integrations/device_trigger.mqtt/
[hasensor]: https://www.home-assistant.io/integrations/sensor.mqtt/
[haswitch]: https://www.home-assistant.io/integrations/switch.mqtt/

## Configuration

 - `logLevel`: _(optional; default: 'info')_ Log level. One of "error", "warn",
   "info", "verbose", "debug", "silly".
 - `http.host` _(optional; default: '0.0.0.0')_: Interface IP for the HTTP
   server to listen on.
 - `http.port` _(optional; default: 8321)_: Port for the HTTP server to listen
   on.
 - `mqtt.broker` _(required)_: MQTT Broker URL.
 - `mqtt.username` _(optional)_: MQTT broker username.
 - `mqtt.password` _(optional)_: MQTT broker password.
 - `mqtt.homeAssistant.discovery` _(optional; default: false)_: Enable
   publishing discovery information for Home Assistant.
 - `options.PLUGIN_NAME` _(optional): Plugin-specific options_

### myStrom Buttons Plugin Options

 - `mystrom-buttons.route` _(optional; default: `"/mystrom-buttons"`)_: Route
   path under which to handle actions from the buttons
 - `mystrom-buttons.mqttTopic` _(optional; default:
   'http2mqtt/mystrom/wifi_buttons')_: MQTT topic prefix under which to
   publish button states
 - `mystrom-buttons.buttons` _(required)_: Configuration for each button. Only
   buttons configured here will be handled.  

#### Button Configuration

 - `mac` _(required)_: MAC address of the button
 - `name` _(required)_: A friendly name for the button
 - `type` _(required)_: Either `"button"` or `"button-plus"` for myStrom Wifi
   button or myStrom Wifi Button Plus respectively
 - `wheelMin` _(button-plus only; required)_: Minimum value for the wheel
 - `wheelMax` _(button-plus only; required)_: Maximum value for the wheel 
 - `wheelSpeed` _(button-plus only; optional; default: 1)_: Multiplier for the
   wheel value. Higher number means fewer rotations to go from `wheelMin` to
   `wheelMax` and vice versa

### myStrom Switch Plugin Options

 - `mystrom-switch.mqttTopic` _(optional; default:
   'http2mqtt/mystrom/wifi_switches')_: MQTT topic prefix under which to
   publish switch states
 - `mystrom-switch.switches` _(required)_: Configuration for each switch. Only
   switches configured here will be handled.

#### Switch Configuration

 - `host` _(required)_: Host or IP address of the switch.
 - `name` _(required)_: A friendly name for the switch.

### Edimax Plug Plugin Options

 - `edimax-plug.mqttTopic` _(optional; default: 'http2mqtt/edimax/wifi_plugs'):
   MQTT topic prefix undwe which to publish switch states._
 - `edimax-plug.switches` _(required)_: Configuration for each switch. Only
   switches configured here will be handled.

#### Switch Configuration

 - `host` _(required)_: Host or IP address of the switch.
 - `name` _(required)_: A friendly name for the switch.
 - `username` _(optional; default: 'admin')_: Username to log in to the switch.
 - `password` _(required)_: Password to log in to the switch.

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
      "buttons": [
        {
          "mac": "BADA55FA7A55",
          "name": "Kitchen Wifi Button Plus",
          "type": "button-plus",
          "wheelMin": 0,
          "wheelMax": 255,
          "wheelSpeed": 2.5
        },
        {
          "mac": "FA7A55BADA55",
          "name": "Bathroom Wifi Button",
          "type": "button"
        }
      ]
    },
    "mystrom-switch": {
      "switches": [
        {
          "host": "10.13.37.43",
          "name": "Wifi Switch 1"
        },
        {
          "host": "10.13.37.44",
          "name": "Wifi Switch 2"
        }
      ]
    },
    "edimax-plug": {
      "switches": [
        {
          "name": "Edimax Switch 1",
          "host": "10.13.37.45",
          "username": "admin",
          "password": "1234"
        }
      ]
    }
  }
}
```

## License

Copyright (c) 2020 Max Kueng

MIT License