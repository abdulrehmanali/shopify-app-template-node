import axios from 'axios';

export const getCustomerFromERP = (mobile) => {
  mobile = mobile.replace(/\+/g, '')
  let url = process.env.ERP_API_HOST+'/api/post/CustomerDetail';
  url += "?api="+process.env.ERP_API_KEY;
  url += "&mobile="+mobile;
  return axios.get(url)
}

export const insertCustomerInERP = (firstname, lastname, mobile, email) => {
  if (!mobile) {
    return
  }
  mobile = mobile.replace(/\+/g, '')
  let url = process.env.ERP_API_HOST+'/api/post/Customer';
  url += "?api="+process.env.ERP_API_KEY;
  url += "&firstname="+firstname;
  url += "&lastname="+lastname;
  url += "&mobile="+mobile;
  url += "&email="+email;
  console.log(url)
  return axios.post(url)
}