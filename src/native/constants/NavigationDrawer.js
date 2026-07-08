import React, { Component } from 'react';
import { Drawer } from 'native-base';
import SideMenu from './sidebar';
export default class DrawerComponent extends Component {
  render() {
    closeDrawer = () => {
      this.drawer._root.close()
    };
    openDrawer = () => {
      this.drawer._root.open()
    };
    return (
      <Drawer
        ref={(ref) => { this.drawer = ref; }}
        content={<SideMenu navigator={this.navigator} />}
  >
      // Main View
      </Drawer>
    );
  }
}