import React, {Component} from 'react'
import { Link } from 'react-router'
import {STATIC_URL} from '../../constants/Common';

export class ProductCategoryCard extends Component{
  render() {
    return (
      <Thumbnail defImgURL={STATIC_URL + '/ggroup_default.jpg'}
        item={this.props.item}
        itemClassName = {this.props.itemClassName}
        compKey = {this.props.compKey}
        onClick = {this.props.onClick}
        linkURL = {this.props.linkURL}>
      </Thumbnail>
    )
  }
}


export class ProductCard extends Component{
  getLink(linkURL, id) {
    return linkURL + id;
  }

  render() {
    let {promo, oldPrice, price, shortDescription, currency} = this.props.item;

    oldPrice = oldPrice && oldPrice.toLocaleString('ua-UA', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    price = price && price.toLocaleString('ua-UA', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    currency = currency || 'грн';

    let imgTemplate;
    const defImgURL = STATIC_URL + '/goods_default.jpg';
    const {imgURL, imgAlt} = this.props.item;
    const key = this.props.compKey;
    const linkURL = this.props.linkURL;
    if (promo) {
      imgTemplate = (
        <Link to={::this.getLink(linkURL, key)} className='itemImage'>
            <img src={STATIC_URL + '/promo.png'} alt='promo' className='promoImg' />
            <img src={imgURL || defImgURL} alt={imgAlt || 'image'+key} className='mainImg' />
        </Link>
      )
    }

    return (
    <Thumbnail defImgURL={defImgURL} imgTemplate={imgTemplate}
      item={this.props.item}
      itemClassName = {this.props.itemClassName}
      compKey = {this.props.compKey}
      onClick = {this.props.onClick}>
      <p className='itemPromo'>{promo}</p>
      <div className='itemPrice'>
        <p className='oldPrice'>{oldPrice}</p>
        {price? <p className='actualPrice'>{price} {currency}</p>: ''}
      </div>
      <p className='itemDescription'>{shortDescription}</p>
    </Thumbnail>
  )
  }
}

class Thumbnail extends Component{
  getLink(linkURL, id) {
    return linkURL + id;
  }

  render() {
    const {imgURL, imgAlt, caption} = this.props.item;
    const key = this.props.compKey;
    const linkURL = this.props.linkURL;
    let imgTemplate = this.props.imgTemplate || (<Link to={::this.getLink(linkURL, key)}><img src={imgURL || this.props.defImgURL} alt={imgAlt || 'image'+key} className='itemImage'/></Link>);

    return (
      <div className={this.props.itemClassName} key={key}>
        <div className='thumbnail'>
          {imgTemplate}
          <div className='caption'>
            <p className='itemCaption'><Link to={::this.getLink(linkURL, key)} >{caption}</Link></p>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }
}
