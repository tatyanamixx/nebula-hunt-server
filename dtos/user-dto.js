module.exports = class UserDto {
	id;
	tmaId;
	role;

	constructor(model) {
		this.id = model.id;
		this.tmaId = model.tmaId;
		this.role = model.role;
	}
};
