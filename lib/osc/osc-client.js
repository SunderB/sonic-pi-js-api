const osc = require('node-osc');

export default class SonicPiOSCClient {
  constructor(ip, port) {
    this.m_port = port;
    this.m_ip = ip;

    this.oscClient = new osc.Client(ip, port, () => {
      console.log(`OSC client ready to send to ${ip}:${port}`);
    });
  }

  send(...args) {
    return this.oscClient.send(...(args));
  }

  destructor() {
    this.oscClient.kill();
  }
}
// 
// send(...args) {
//   // Get IP addresses and ports
//   const sp_server_ip = atom.config.get('sb-atom-sonic-pi.sonicPiServerIP');
//   const sp_server_port = atom.config.get('sb-atom-sonic-pi.sonicPiServerPort');
//
//   const sp_gui_ip = atom.config.get('sb-atom-sonic-pi.sonicPiGUIIP');
//   const sp_gui_port = atom.config.get('sb-atom-sonic-pi.sonicPiGUIPort');
//
//   // Send OSC messages
//   if (atom.config.get('sb-atom-sonic-pi.sendOSCMessagesToGUI') === true) {
//     const sp_gui = new osc.Client(sp_gui_ip, sp_gui_port);
//     sp_gui.send(...(args), () => sp_gui.kill());
//   }
//   const sp_server = new osc.Client(sp_server_ip, sp_server_port);
//
//   console.log(`Sent ${args} to ${sp_server_ip}:${sp_server_port}`);
//   atom.notifications.addInfo(`Sent ${args} to ${sp_server_ip}:${sp_server_port}`);
//   return sp_server.send(...(args), () => sp_server.kill());
// },
