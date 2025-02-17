const Sequelize = require('sequelize');
const { database, user, password } = require('./MainConfig.json');

const sequelize = new Sequelize(database, user, password, {
	host: 'eu02-sql.pebblehost.com',
	dialect: 'mysql',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const Tags = sequelize.define('tags', {
	messageID: {
		type: Sequelize.STRING,
		unique: true,
	},
	messageAuthorName: Sequelize.STRING,
	messageAuthorId: Sequelize.STRING,
	messageAuthorAvatar: Sequelize.STRING,
	messageURL: Sequelize.TEXT,
	reactCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	attachment: Sequelize.STRING,
	posted: Sequelize.BOOLEAN,
	linkedEmbed: Sequelize.TEXT,
});

const Booster = sequelize.define('users', {
	userId: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	username: Sequelize.STRING,
	boostCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

const suggestions = sequelize.define('suggestions', {
	pk_suggestions: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	su_id: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	suggestionSuggestion: Sequelize.STRING,
	suggestionSuggerant: Sequelize.STRING,
	suggestionCountTrue: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	suggestionCountFalse: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	suggestionImage: Sequelize.STRING,
});

const userLevels = sequelize.define('userLevels', {
	pk_userLevels: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	ul_name: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	ul_user_id: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	ul_level: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	ul_xp: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

const badUsers = sequelize.define('badUsers', {
	pk_badUsers: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	bu_id: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	bu_name: {
		type: Sequelize.STRING,
		allowNull: false,
	},
})

const staffMembers = sequelize.define('staffMembers', {
	pk_staffMembers: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	sm_user_id: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	sm_staff_name: {
		type: Sequelize.STRING,
		allowNull: false,
	},
})

const warns = sequelize.define('warns', {
	pk_warns: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	wa_reason: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	wa_date: {
		type: Sequelize.DATE,
		allowNull: false,
	},
	wa_fk_badUserId: {
		type: Sequelize.INTEGER,
		references: {
			model: badUsers,
			key: 'pk_badUsers',
		},
		allowNull: false,
	},
	wa_fk_staffMemberId: {
		type: Sequelize.INTEGER,
		references: {
			model: staffMembers,
			key: 'pk_staffMembers',
		},
		allowNull: false,
	},
})

const warnRemoves = sequelize.define('warnRemoves', {
	pk_warnRemoves: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	wr_reason: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	wr_date: {
		type: Sequelize.DATE,
		allowNull: false,
	},
	wr_pk_warns: {
		type: Sequelize.INTEGER,
		references: {
			model: warns,
			key: 'pk_warns',
		},
	},
	wr_pk_staffMembers: {
		type: Sequelize.INTEGER,
		references: {
			model: staffMembers,
			key: 'pk_staffMembers',
		},
	},
})

const bans = sequelize.define('bans', {
	pk_bans: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	ba_reason: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	ba_date: {
		type: Sequelize.DATE,
		allowNull: false,
	},
	ba_fk_badUsers: {
		type: Sequelize.INTEGER,
		references: {
			model: badUsers,
			key: 'pk_badUsers',
		},
	},
	ba_fk_staffMembers: {
		type: Sequelize.INTEGER,
		references: {
			model: staffMembers,
			key: 'pk_staffMembers',
		},
	},
})

const bansRemoves = sequelize.define('bansRemoves', {
	pk_banRemoves: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	br_reason: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	br_date: {
		type: Sequelize.DATE,
		allowNull: false,
	},
	br_fk_bans: {
		type: Sequelize.INTEGER,
		references: {
			model: bans,
			key: 'pk_bans',
		},
	},
	br_fk_staffMembers: {
		type: Sequelize.INTEGER,
		references: {
			model: staffMembers,
			key: 'pk_staffMembers',
		},
	},
})

const kicks = sequelize.define('kicks', {
	pk_kicks: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	ki_reason: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	ki_date: {
		type: Sequelize.DATE,
		allowNull: false,
	},
	ki_fk_badUsers: {
		type: Sequelize.INTEGER,
		references: {
			model: badUsers,
			key: 'pk_badUsers',
		},
	},
	ki_fk_staffMembers: {
		type: Sequelize.INTEGER,
		references: {
			model: staffMembers,
			key: 'pk_staffMembers',
		},
	},
})

sequelize.sync({ force: false });

module.exports = { Tags, Booster, suggestions, userLevels, badUsers, sequelize, staffMembers, warns, warnRemoves, bans, bansRemoves, kicks };