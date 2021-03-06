import React, {Component} from 'react'
import * as widgets from '../Widgets';

export class ThumbnailsView extends Component{
  constructor(props) {
    super(props);
  }

  render() {
    let data = this.props.data;
    let ThumbnailComp = widgets[this.props.thumbnailComp];
    let template;
    if (data) {
      template = data.map((item, i) => {
        let compKey = item.id || i;
        return <ThumbnailComp
          itemClassName = {this.props.itemClassName}
          compKey = {compKey}
          onClick = {this.props.onItemClick}
          item = {item}
          linkURL = {this.props.linkURL}
        />
      })
    }
    return (
      <div className={this.props.galleryClassName}>
        {template}
      </div>
    )
  }

}
